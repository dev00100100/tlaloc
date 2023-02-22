const scrapper = require("./postservice");
const Feed = require("../models/feed");
const User = require("../models/user");
const utils = require("../functions/utils");
const sharp = require("sharp");
const { ObjectID } = require("bson");
const u = utils.getInstance();
const logger = require("../functions/eventService");
const IG_API = require("instagram-private-api");
const LoginService = require("../functions/loginService");

class Instagram extends scrapper {
  constructor(owner) {
    super();
    this.duplicate = false;
    this.duplicates = [];
    this.component = "instagram.js";
    this.owner = owner;
  }

  async getRealUsername(item) {
    if (item.caption && item.caption.text) {
      let userResult = item.caption.text.match(/@[a-z0-9\_\.]*/i);
      let user = "";
      let username = "";

      if (userResult && userResult.length > 0) {
        user = userResult[0].replace("@", "");

        let isSharer = await User.findOne({ username: item.user.username, status: "sharer" });
        let dbUser = await User.findOne({ username: user });

        if (dbUser && isSharer) {
          username = dbUser.username;
        } else {
          username = item.user.username;
        }
        return username;
      } else {
        return item.user.username;
      }
    } else {
      return item.user.username;
    }
  }

  getCaption(item) {
    if (item.caption && item.caption.text) return item.caption.text;
    else {
      return "";
    }
  }

  async scrap(items) {
    let result = [];
    let promises = [];
    for (let item of items) {
      let user = await this.getRealUsername(item);

      let itemdb = {
        id: item.id,
        pk: item.pk,
        code: item.code,
        username: user,
        caption: this.getCaption(item),
        images: []
      };
      if (item.carousel_media && item.carousel_media.length > 0) {
        promises.push(this.scrapCarousel(item.carousel_media, itemdb));
      } else {
        promises.push(this.scrapImage(item, itemdb));
      }
    }
    result = await Promise.all(promises);
    return result;
  }

  async scrapCarousel(carousel, mainItem) {
    for (let media of carousel) {
      let image = media.image_versions2.candidates[0];
      let imageBuffer = await super.getImage(image.url);
      let imagedb = {
        id: media.id,
        pk: media.pk,
        width: image.width,
        height: image.height,
        url: image.url,
        image: imageBuffer.data
      };
      mainItem.images.push(imagedb);
    }

    return mainItem;
  }

  async scrapImage(image, mainItem) {
    let imageCandidate = image.image_versions2.candidates[0];
    let imageBuffer = await super.getImage(imageCandidate.url);
    let imagedb = {
      id: image.id,
      width: imageCandidate.width,
      height: imageCandidate.height,
      url: imageCandidate.url,
      image: imageBuffer.data,
      size: imageBuffer.length
    };
    mainItem.images.push(imagedb);
    return mainItem;
  }

  async createUser(feed) {
    let exists = await User.exists({ username: feed.username, owner: this.owner });
    if (!exists) {
      let user = new User({
        id: u.guid(),
        username: feed.username,
        thumbnail: await sharp(feed.images[0].image).resize(180, 290).toBuffer(),
        type: "model",
        owner: this.owner
      });
      return user.save();
    }
  }

  async save(feeds) {
    let promises = [];
    for (let feed of feeds) {
      await this.createUser(feed);

      let feeddto = {
        id: feed.id,
        pk: feed.pk,
        code: feed.code,
        username: feed.username,
        user: feed.user,
        thumbnail: "",
        images: [],
        owner: this.owner
      };

      for (let image of feed.images) {
        let imagedto = {
          id: image.id,
          image: image.image,
          url: image.url,
          width: image.width,
          height: image.height,
          size: image.image.length,
          thumbnail: await sharp(image.image).resize(180, 290).toBuffer()
        };
        feeddto.images.push(imagedto);
      }

      let feeddb = new Feed(feeddto);

      promises.push(
        (async _ => {
          let exists = await Feed.exists({ id: feeddb.id, owner: this.owner });

          if (!exists) {
            logger.terminal({ component: this.component, message: `Saving ${feeddb.username} - ${feeddb.id}`, owner: this.owner });

            this.duplicates.push({
              id: feeddb.id,
              exists: false
            });
            return feeddb.save();
          } else {
            logger.terminal({ component: this.component, message: `Already exist: [${feeddb.id}] [${feeddb.username}] `, owner: this.owner });

            this.duplicates.push({
              id: feeddb.id,
              exists: true
            });
          }
        })()
      );
    }
    return Promise.all(promises);
  }

  async getFeedByImageId(feedId) {
    const feed = await Feed.findOne({
      "images._id": new ObjectID(feedId)
    });
    return feed;
  }

  async getFeed(feedId) {
    if (typeof feedId !== "string") {
      feedId = feedId.toString();
    }

    const feed = await Feed.findOne({ _id: new ObjectID(feedId) });
    return feed;
  }


  async get(username) {
    const session = await User.findOne({ username: username, owner: this.owner });

    if (session != null && session.session != null) {
      return session.session;
    }

    return null;
  }

  async set(username, value) {
    return User.findOneAndUpdate(
      { username: username, owner: this.owner },
      {
        id: u.guid(),
        username: username,
        owner: this.owner,
        session: JSON.stringify(value),
      },
      { upsert: true, useFindAndModify: false }
    );   
  }

  async exists(username) {
    const exists = (await this.get(username)) !== null;
    return exists;
  }

  async getSession(username, password) {
    const ig = new IG_API.IgApiClient();
    ig.state.generateDevice(this.owner);

    ig.request.end$.subscribe(async () => {
      const serialized = await ig.state.serialize();
      delete serialized.constants;       
      this.set(this.owner, serialized);
    });

    if (await this.exists(this.owner)) {
      try {
        //await ig.simulate.preLoginFlow();
        const session = await this.get(this.owner);       
        await ig.state.deserialize(session);
        await ig.user.info(ig.state.cookieUserId)
        await ig.account.currentUser();
      } catch (e) {        
        console.log(e.message);
        await ig.account.login(username, password);
        const serialized = await ig.state.serialize();
        this.set(this.owner, serialized);
      }
    } else {
      await ig.account.login(username, password);
      const serialized = await ig.state.serialize();
      await this.set(this.owner, serialized);
    }
    return ig;
  }


  async post(galleryId, isFeedId, queue) {
    //const ig = new IG_API.IgApiClient();
    let feed;

    if (queue) {
      logger.log({ message: `QueueId: ${queue._id}`, component: "instagram.js" });
    } else {
      queue = {};
    }

    if (!isFeedId) {
      feed = await this.getFeedByImageId(galleryId);
    } else {
      feed = await this.getFeed(galleryId);
    }

    let tagsCaption = "";
    let postingOptions = {};

    if (feed.tags && feed.tags.length > 0) {
      tagsCaption = feed.tags.reduce((tags, tag) => tags + `#${tag} `, " ");
    }

    if (feed.images.length > 1) {
      const images = feed.images.map(image => ({ file: image.image }));

      postingOptions = {
        items: images
      };
    } else {
      postingOptions = {
        file: feed.images[0].image
      };
    }

    let user = await User.findOne({ username: feed.username });

    if (user.favorite) {
      tagsCaption += "#waifu";
      logger.terminal({ message: `Set tag #waifu - [${user.username}]`, component: this.component });
    }

    let caption = "";
    if (queue.type === "priority") {
      caption = queue.caption.replace("[[USERNAME]]", `@${feed.username}`);
    } else {
      if (queue.caption) {
        caption = queue.caption.replace("[[USERNAME]]", `@${feed.username}`);
      } else {
        caption = user.caption.replace("[[USERNAME]]", `@${feed.username}`);
      }
    }

    logger.log({ message: `Queue Type: ${queue.type}`, component: __filename });

    caption = caption.replace("[[TAGS]]", tagsCaption);

    postingOptions.caption = caption + ' #tllc';

    logger.terminal({
      component: this.component,
      message: `id: ${feed._id} <br>username: ${feed.username}<br><br>${postingOptions.caption.replace(/(\r\n|\n|\r)/gm, "<br>")}`
    });

    let result = { status: 'error' };
    if (process.env.prod === "true") {

      try {
        console.log(`Owner: ${this.owner}`);
        const loginService = new LoginService(this.owner);
        const postUser = await loginService.getConfigurationUser("poster_user");

        // ig.state.generateDevice(JSON.stringify(postUser.username));
        // await ig.simulate.preLoginFlow();
        // await ig.account.login(postUser.username, postUser.password);
        
        const ig = await this.getSession(postUser.username, postUser.password);
        
        logger.terminal({ component: this.component, message: `${postUser.username}|${postUser.password}` });
        logger.terminal({ component: this.component, message: "Posting" });
        

        if (feed.images.length > 1) {
          result = await ig.publish.album(postingOptions);
        } else {
          result = await ig.publish.photo(postingOptions);
        }

        let publishedUserCount = user.publishedCount || 0;
        let publishedFeedCount = feed.publishedCount || 0;

        feed.publishedCount = ++publishedFeedCount;
        user.publishedCount = ++publishedUserCount;

        await Promise.all([feed.save(), user.save()]);
        logger.terminal({ component: this.component, message: "Posted" });
        
      } catch (e) {
        if (queue) {
          queue.status = "error";
          await queue.save();
        }

        logger.terminal({ component: this.component, message: e.message });
        logger.error({ component: this.component, message: e.message, stack: e.stack });
      }
    } else {
      logger.log({ component: this.component, message: "...NOT PROD ENV...", save: false });
    }
    return result;
  }
}

module.exports = Instagram;
