const IG_API = require("instagram-private-api");
const ig = new IG_API.IgApiClient();
const Instagram = require("../../functions/instagram");
const utils = require("../../functions/utils");
const User = require("../../models/user");
const Feed = require("../../models/feed");
const Queue = require("../../models/queue");
const QueueService = require("../../functions/queueservice");
const middlewares = require("../../functions/middlewares");
const logger = require("../../functions/eventService");
const LoginService = require("../../functions/loginService");
const { ObjectID } = require("bson");
const u = utils.getInstance();

module.exports = params => {
  const app = params.app;
  const component = "postservice.js";

  app.post("/instagram/api/getSavedItems", middlewares.secureRoute, async (request, response) => {
    const login = new LoginService(request.session.data.username);
    const loginData = await login.getConfigurationUser("scrapper_user");

    (async userScrapper => {
      const scrapper = new Instagram(request.session.data.username);
      ig.state.generateDevice(JSON.stringify(loginData.username));
      //await ig.simulate.preLoginFlow();

      logger.terminal({ message: `${userScrapper.username}|**************`, component });

      await ig.account.login(userScrapper.username, userScrapper.password);

      let feed = await ig.feed.saved();

      do {
        let items = await feed.items();

        let result = await scrapper.scrap(items);
        await scrapper.save(result);

        if (!scrapper.duplicates.some(d => !d.exists)) {
          break;
        }

        scrapper.duplicates = [];
        logger.terminal({ message: "sleeping: 5 seconds.", component });
        await u.sleep(5000);
      } while (feed.isMoreAvailable());
    })(loginData);

    response.send({
      status: "done",
      message: "processing"
    });
  });

  app.post("/instagram/api/postrandom/", middlewares.secureRoute, async (request, response) => {
    const secureusers = await User.countDocuments({ status: "secure", owner: request.session.data.username });
    const max = secureusers - 1;

    const randomUser = Math.ceil(Math.random() * max);
    const user = await User.findOne({ status: "secure" }).skip(randomUser).limit(1);

    logger.log({ component: __filename, message: `randomUserId: ${randomUser}, randomUser: ${user.username} ` });

    const feeds = await Feed.find({ username: user.username, owner: request.session.data.username });
    const maxFeed = feeds.length;

    const randomFeed = Math.ceil(Math.random() * (maxFeed - 1));

    const feed = feeds[randomFeed];

    logger.log({ component: __filename, message: `randomFeedId: ${randomFeed}, randomFeed: ${feed.code} ` });

    const exists = await Queue.exists({ feedId: new ObjectID(feed._id) });

    if (!exists) {
      const queue = new Queue({
        id: u.guid(),
        feedId: new ObjectID(feed._id),
        status: "pending",
        owner: request.session.data.username
      });

      await Promise.all([queue.save(), user.save(), feed.save()]);

      const message = `model [${feed.username}] [${feed.id}] [${feed.code}]`;

      logger.terminal({ message, component });

      response.status(200).send({
        status: "done",
        message
      });
    } else {
      const message = `Queue Item already exist [${feed.username}]`;
      logger.terminal({ message, component });
      response.send({
        status: "done",
        message
      });
    }
  });

  app.post("/instagram/api/post/:feedId", middlewares.secureRoute, async (request, response) => {
    const instagram = new Instagram(request.session.data.username);
    let feed = await instagram.post(request.params.feedId, true);

    response.send({
      status: "done",
      message: `posted [${feed.username}] [${request.params.feedId}] [${feed.code}]`
    });
  });

  app.post("/instagram/api/processQueue", middlewares.secureRoute, async (request, response) => {
    const queueService = new QueueService();
    const count = await queueService.countProcessQueue("active");

    queueService.processQueue({
      emiterTarget: "terminal",
      status: "active",
      sleepTime: 60000,
      limit: 2,
      owner: request.session.data.username
    });

    response.send({
      status: "done",
      message: `Processing: ${count} items.`
    });
  });
};
