const u = require("../../functions/utils").getInstance();
const Feed = require("../../models/feed");
const Queue = require("../../models/queue");
const dateFormat = require("dateformat");
const middlewares = require("../../functions/middlewares");
const logger = require("../../functions/eventService");
const { ObjectID } = require("bson");
const QueueService = require("../../functions/queueservice");
const User = require("../../models/user");

module.exports = params => {
  const app = params.app;

  app.post("/instagram/api/queue/:feedId", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    let feed = request.params.feedId;
    let caption = request.body.caption || "";
    const type = request.body.type || "normal";
    const username = request.body.username;
    const time = request.body.time;
    const offSet = request.body.offSet;

    const exists = await Queue.exists({ feedId: new ObjectID(feed) });

    const localTime = new Date(time.year, time.month - 1, time.day, time.hour, time.minute);
    const utcTime = new Date(localTime.getTime() + offSet * 60000);

    if (!caption) {
      const user = await User.findOne({ username, owner: session.username });
      caption = user.caption;
    }

    if (!exists) {
      const queue = new Queue({
        id: u.guid(),
        feedId: new ObjectID(feed),
        status: type === "priority" || type === "inmediate" ? "active" : "pending",
        nextRunTime: utcTime,
        priority: type === "priority" ? 1 : 10,
        caption,
        type,
        username,
        offSet,
        owner: session.username
      });

      await queue.save();
      const message = `model [${username}] [${feed}]`;

      logger.terminal({ message, component: __filename, owner: session.username });
      response.send({
        status: "done",
        message
      });
    } else {
      response.send({
        status: "done",
        message: `Queue Item already exist [${username}][${feed}]`
      });
    }
  });

  app.post("/instagram/api/queue/postqueueitem/:queueId", async (request, response) => {
    const session = request.session.data;
    const queue = new QueueService();
    await queue.postQueueItem(request.params.queueId);
    response.send({ status: "done", message: `Queue Item [${request.params.queueId}] posted.`, owner: session.username });
  });

  app.post("/instagram/api/queue/configuration/cron/setcron", async (request, response) => {
    const session = request.session.data;
    const queue = new QueueService();
    logger.terminal({
      component: "queue.js",
      message: `Updating CRON configuration`,
      owner: session.username
    });

    await queue.setCronJob(session.username);
    response.send({ status: "done", message: "CRON job re-started with new configuration." });
  });

  app.get("/instagram/api/queue/metrics/stats", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const stats = await Queue.aggregate([
      { $match: { owner: session.username } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: "$_id",
          count: "$count"
        }
      }
    ]);

    const statsdto = {
      active: stats.find(s => s.status == "active") ? stats.find(s => s.status == "active").count : 0,
      pending: stats.find(s => s.status == "pending") ? stats.find(s => s.status == "pending").count : 0,
      posted: stats.find(s => s.status == "posted") ? stats.find(s => s.status == "posted").count : 0,
      error: stats.find(s => s.status == "error") ? stats.find(s => s.status == "error").count : 0
    };

    const queueStats = {
      active: statsdto.active,
      pending: statsdto.pending,
      posted: statsdto.posted,
      error: statsdto.error
    };

    response.send({ status: "done", stats: queueStats });
  });

  app.post("/instagram/api/queue/changepriority/:queueId/:priority", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    let queue = await Queue.findOne({ _id: new ObjectID(request.params.queueId) });

    const previousPriority = queue.priority;
    queue.priority = request.params.priority;
    await queue.save();

    logger.tevent({
      message: `Queue [${queue._id}] priority changed from '${previousPriority}' to '${queue.priority}'`,
      component: "queue.js",
      owner: session.username
    });

    response.send({
      status: "done",
      message: `Queue priority changed  from '${previousPriority}' to '${queue.priority}'`,
      priority: queue.priority
    });
  });

  app.post("/instagram/api/queue/caption/edit/:queueId", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    let queue = await Queue.findOne({ _id: new ObjectID(request.params.queueId) });

    queue.caption = request.body.caption;
    await queue.save();

    logger.tevent({ message: `Queue [${queue._id}] caption edited.`, component: __filename, owner: session.username });

    response.send({
      status: "done",
      message: `Queue [${queue._id}] caption edited.`
    });
  });

  app.get("/instagram/api/queue/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const pageSize = 15;
    const page = request.params.page;
    const count = await Queue.countDocuments({ owner: session.username });
    const pages = Math.ceil(count / pageSize);
    const queueObject = [];

    const queues = await Queue.aggregate([
      { $match: { owner: session.username } },
      {
        $lookup: {
          from: "feeds",
          localField: "feedId",
          foreignField: "_id",
          as: "feed"
        }
      },
      {
        $unwind: "$feed"
      },
      {
        $project: {
          _id: 1,
          "feed.tags": 1,
          "feed._id": 1,
          "feed.username": 1,
          created: 1,
          status: 1,
          posted: 1,
          priority: 1,
          caption: 1,
          type: 1,
          nextRunTime: 1
        }
      }
    ])
      .sort({
        status: 1,
        priority: 1,
        created: 1
      })
      .skip(page * pageSize)
      .limit(pageSize);

    for (let q of queues) {
      const offSet = q.offSet || new Date().getTimezoneOffset();
      let queue = {
        id: q._id,
        status: q.status,
        priority: q.priority,
        created: dateFormat(q.created, "dd/mm/yy h:MM:ss TT"),
        posted: dateFormat(q.posted, "dd/mm/yy h:MM:ss TT"),
        feed: {
          id: q.feed._id,
          tags: q && q.feed.tags ? q.feed.tags : [],
          username: q.feed.username
        },
        caption: q.caption,
        type: q.type || "normal",
        nextRunTime: q.type === "priority" ? dateFormat(new Date(q.nextRunTime - offSet * 60000), "dd/mm/yy h:MM:ss TT") : ""
      };
      queueObject.push(queue);
    }

    response.send({
      queues: queueObject,
      pages: pages,
      currentPage: page
    });
  });

  app.delete("/instagram/api/queue/:queueId", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    await Queue.findOneAndDelete({ _id: new ObjectID(request.params.queueId) });

    logger.tevent({ message: `Queue item removed [${request.params.queueId}] from queue.`, component: "queue.js", owner: session.username });

    response.send({
      status: "done",
      message: `Queue item removed [${request.params.queueId}] from queue.`
    });
  });

  app.post("/instagram/api/queue/changestatus/:queueId", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    let queue = await Queue.findOne({ _id: new ObjectID(request.params.queueId) });
    const oldStatus = queue.status;

    queue.status = queue.status === "active" ? "pending" : "active";
    await queue.save();

    logger.tevent({ message: `Queue [${queue._id}] status changed from '${oldStatus}' to '${queue.status}'`, component: __filename, owner: session.username });

    response.send({
      status: "done",
      message: `Queue status changed to '${queue.status}'`,
      state: queue.status
    });
  });

  app.post("/instagram/api/queue/search/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const page = request.params.page;
    const pageSize = 15;
    const queueObject = [];
    const queryRegex = new RegExp(`.*${request.body.searchTerm}.*`, "i");

    const filter = {
      $or: [
        {
          "feed.username": {
            $regex: queryRegex
          }
        },
        {
          "feed.tags": {
            $regex: queryRegex
          }
        }
      ]
    };

    let search = [];
    if (request.body.status) {
      search.push({ status: request.body.status });
    }

    if (request.body.type) {
      search.push({ type: request.body.type });
    }

    if (search.length > 0) {
      filter["$and"] = search;
    }

    const searchQuery = [
      {
        $match: { owner: session.username }
      },
      {
        $lookup: {
          from: "feeds",
          localField: "feedId",
          foreignField: "_id",
          as: "feed"
        }
      },
      {
        $unwind: "$feed"
      },
      {
        $match: filter
      },
      {
        $project: {
          _id: 1,
          "feed.tags": 1,
          "feed._id": 1,
          "feed.username": 1,
          created: 1,
          status: 1,
          priority: 1,
          posted: 1,
          caption: 1,
          type: 1,
          nextRunTime: 1
        }
      }
    ];

    const countQueues = await Queue.aggregate(searchQuery);

    const queueResult = await Queue.aggregate(searchQuery)
      .sort({
        status: 1,
        priority: 1,
        created: 1
      })
      .skip(page * pageSize)
      .limit(pageSize);

    const pages = Math.ceil(countQueues.length / pageSize);

    for (let q of queueResult) {
      const offSet = q.offSet || new Date().getTimezoneOffset();
      let queue = {
        id: q._id,
        status: q.status,
        created: dateFormat(q.created, "dd/mm/yy h:MM:ss TT"),
        posted: dateFormat(q.posted, "dd/mm/yy h:MM:ss TT"),
        priority: q.priority,
        feed: {
          id: q.feed._id,
          tags: q && q.feed.tags ? q.feed.tags : [],
          username: q.feed.username,
          images: []
        },
        caption: q.caption,
        type: q.type || "normal",
        nextRunTime: q.type === "priority" ? dateFormat(new Date(q.nextRunTime - offSet * 60000), "dd/mm/yy h:MM:ss TT") : ""
      };
      queueObject.push(queue);
    }

    logger.terminal({ message: `pages: ${pages} currentPage: ${page} page: ${page}`, component: __filename, owner: session.username });

    response.send({
      queues: queueObject,
      pages: pages,
      currentPage: page,
      page: page
    });
  });
};
