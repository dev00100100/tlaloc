const utils = require("../../functions/utils");
const Feed = require("../../models/feed");
const Queue = require("../../models/queue");
const dateFormat = require("dateformat");
const Instagram = require("../../functions/instagram");
const middlewares = require("../../functions/middlewares");
const logger = require("../../functions/eventService");
const sharp = require("sharp");
const { ObjectID } = require("bson");
const FeedService = require("../../functions/feedservice");
const u = utils.getInstance();

module.exports = params => {
  const app = params.app;

  app.post("/instagram/api/feed/post/:feedId", middlewares.secureRoute, async (request, response) => {
    const instagram = new Instagram();
    let feed = await instagram.post(request.params.feedId, true);
    response.send({
      status: "done",
      message: `posted [${feed.username}] [${request.params.galleryId}] [${feed.code}]`
    });
  });

  app.post("/instagram/api/feed/queue/:feedId", middlewares.secureRoute, async (request, response) => {
    let feed = request.params.feedId;
    console.log(feed);

    const exists = await Queue.exists({
      feedId: new ObjectID(feed)
    });

    if (!exists) {
      const queue = new Queue({
        id: u.guid(),
        feedId: new ObjectID(feed),
        status: "pending"
      });

      await queue.save();

      response.send({
        status: "done",
        message: `Queue Item created [${queue.id}] [${feed}]`
      });
    } else {
      response.send({
        status: "done",
        message: `Queue Item already exist [${feed}]`
      });
    }
  });

  //Create a new feed
  app.post("/instagram/api/feed/:username", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const newFeeds = request.body;
    let promises = [];
    const feedService = new FeedService();

    for (let feed of newFeeds) {
      const feeds = Feed.aggregate([
        {
          $match: {
            "images._id": new ObjectID(feed.id)
          }
        },
        {
          $unwind: "$images"
        },
        {
          $match: {
            "images._id": new ObjectID(feed.id)
          }
        },
        {
          $project: {
            images: 1
          }
        }
      ]);
      promises.push(feeds);
    }

    let results = await Promise.all(promises);
    const date = dateFormat(new Date(), "ddmmyyhMMss");

    let feed = new Feed({
      id: u.guid(),
      pk: u.guid(),
      code: `LCL${date}`,
      username: request.params.username,
      user: request.params.username,
      favorite: false,
      thumbnail: null,
      images: [],
      tags: [],
      publishedCount: 0,
      owner: session.username
    });

    const feedIds = [];

    for (let feeds of results) {
      for (let f of feeds) {
        feedIds.push({ feedId: f._id, imageId: f.images._id });
        console.log(f.images._id);
        const imagedto = {
          id: u.guid(),
          image: f.images.image,
          url: f.images.url,
          width: f.images.width,
          height: f.images.height,
          size: f.images.size,
          thumbnail: await sharp(f.images.image.buffer).resize(180, 290).toBuffer()
        };
        feed.images.push(imagedto);
      }
    }

    try {
      await feed.save();
      promises = [];
      for (let f of feedIds) {
        promises.push(
          Feed.updateOne(
            { _id: new ObjectID(f.feedId) },
            {
              $pull: {
                images: {
                  _id: new ObjectID(f.imageId)
                }
              }
            }
          )
        );
      }

      await Promise.all(promises);

      const deleteFeeds = [];
      for (let f of feedIds) {
        deleteFeeds.push(
          (async _ => {
            if (await feedService.isFeedEmpty(f.feedId)) {
              logger.log({ message: `Deleting empty feed ${f.feedId}` });
              return feedService.deleteFeed(f.feedId);
            }
          })()
        );
      }
      await Promise.all(deleteFeeds);
    } catch (e) {
      logger.error({ message: e.message, stack: e.stack, component: __filename });
      response.send({ status: "error", message: `${e.message} \n ${e.stack}` });
    }

    response.send({ status: "done", message: `Feed created [${request.params.username}] [${feed._id}]` });
  });

  app.get("/instagram/api/feeds/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const pageSize = 15;
    const page = request.params.page;
    const count = await Feed.countDocuments({ owner: session.username });
    const pages = Math.ceil(count / pageSize);
    const feedObjects = [];
    const feeds = await Feed.find({ owner: session.username })
      .skip(page * pageSize)
      .limit(pageSize);

    for (let feed of feeds) {
      let dto = {
        id: feed._id,
        username: feed.username,
        code: feed.code,
        created: dateFormat(feed.created, "dd/mm/yy h:MM:ss TT"),
        publishedCount: feed.publishedCount,
        tags: feed.tags.length > 0 ? feed.tags.reduce((tagsConcatenated, value) => (tagsConcatenated += `#${value} `), ` `) : "",
        imageCount: feed.images.length
      };
      feedObjects.push(dto);
    }

    response.send({
      status: "done",
      feeds: feedObjects,
      pages: pages,
      page: page,
      currentPage: page
    });
  });

  const search = async (request, response) => {
    const page = request.params.page;
    const pageSize = 15;
    const queryRegex = new RegExp(request.params.query, "i");
    const searchEmptyFilter = {
      $where: "this.images.length == 0",
      owner: request.session.data.username
    };
    const searchQuery = {
      $and: [
        { owner: request.session.data.username },
        {
          $or: [
            {
              username: queryRegex
            },
            {
              user: queryRegex
            },
            {
              tags: queryRegex
            },
            {
              code: queryRegex
            },
            {
              status: queryRegex
            }
          ]
        }
      ]
    };

    let countFeed;
    let feedResult;

    logger.terminal({ message: JSON.stringify(request.params), component: `feed.js` });

    if (request.params.searchForEmpty) {
      countFeed = await Feed.find(searchEmptyFilter);
      feedResult = await Feed.find(searchEmptyFilter)
        .sort({
          username: 1,
          created: 1
        })
        .skip(page * pageSize)
        .limit(pageSize);
    } else {
      countFeed = await Feed.find(searchQuery);
      feedResult = await Feed.find(searchQuery)
        .sort({
          username: 1,
          created: 1
        })
        .skip(page * pageSize)
        .limit(pageSize);
    }

    const pages = Math.ceil(countFeed.length / pageSize);
    const feedObjects = [];
    for (let feed of feedResult) {
      let dto = {
        id: feed._id,
        username: feed.username,
        code: feed.code,
        created: dateFormat(feed.created, "dd/mm/yy h:MM:ss TT"),
        publishedCount: feed.publishedCount || 0,
        tags: feed.tags.length > 0 ? feed.tags.reduce((tagsConcatenated, value) => (tagsConcatenated += `#${value} `), "") : ""
      };
      feedObjects.push(dto);
    }

    response.send({
      status: "done",
      feeds: feedObjects,
      pages: pages,
      page: page,
      currentPage: page
    });
  };

  app.get("/instagram/api/feeds/search/:page/:query", middlewares.secureRoute, search);
  app.get("/instagram/api/feeds/search/empty/:page/:searchForEmpty", middlewares.secureRoute, search);

  app.delete("/instagram/api/feeds/:feedId", async (request, response) => {
    const deleteResult = await Feed.findOneAndDelete({
      _id: ObjectID(request.params.feedId)
    });

    response.send({
      status: "done",
      message: `Feed [${request.params.feedId}] removed.`
    });
  });
};
