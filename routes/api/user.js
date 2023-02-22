const User = require("../../models/user");
const UserService = require("../../functions/userservice");
const middlewares = require("../../functions/middlewares");
const dateFormat = require("dateformat");
const { ObjectID } = require("bson");
const Feed = require("../../models/feed");

module.exports = params => {
  const app = params.app;
  const pageSize = 15;
  const filter = [
    { $match: { type: "model" } },
    { $sort: { username: 1, status: 1 } },
    { $skip: 0 },
    { $limit: pageSize },
    {
      $lookup: {
        from: "feeds",
        localField: "username",
        foreignField: "username",
        as: "feeds"
      }
    },
    {
      $unwind: {
        path: "$feeds",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "queues",
        localField: "feeds._id",
        foreignField: "feedId",
        as: "queues"
      }
    },
    {
      $unwind: {
        path: "$queues",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          username: "$username",
          userId: "$_id",
          status: "$status",
          favorite: "$favorite",
          caption: "$caption",
          created: "$created",
          publishedCount: "$publishedCount"
        },
        size: { $sum: { $size: "$feeds.images" } },
        status: { $push: "$queues.status" }
      }
    },
    {
      $unwind: {
        path: "$status",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          _id: "$_id",
          status: "$status"
        },
        size: {
          $first: "$size"
        },
        count: {
          $sum: 1
        }
      }
    },
    {
      $group: {
        _id: "$_id._id",
        size: {
          $first: "$size"
        },
        status: {
          $push: {
            status: "$_id.status",
            count: "$count"
          }
        }
      }
    },
    {
      $project: {
        _id: "$_id.userId",
        username: "$_id.username",
        status: "$_id.status",
        favorite: "$_id.favorite",
        caption: "$_id.caption",
        created: "$_id.created",
        publishedCount: "$_id.publishedCount",
        size: "$size",
        queueMetrics: "$status"
      }
    }
  ];

  app.get("/instagram/api/user/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const localFilter = JSON.parse(JSON.stringify(filter));
    const match = localFilter.find(f => typeof f.$match !== "undefined");

    match["$match"]["owner"] = session.username;

    const pagination = localFilter.find(f => typeof f.$skip !== "undefined");
    pagination.$skip = pageSize * request.params.page;

    if (request.body.sort) {
      let sorted = localFilter.find(f => typeof f.$sort !== "undefined");
      sorted["$sort"] = request.body.sort;
    }

    const count = await User.countDocuments(match["$match"]);
    const userResponse = await User.aggregate(localFilter);

    const result = userResponse.map(u => {
      u.queueStats = {};
      u.queueStats.active = u.queueMetrics.find(m => m.status === "active") || { status: "active", count: 0 };
      u.queueStats.pending = u.queueMetrics.find(m => m.status === "pending") || { status: "pending", count: 0 };
      u.queueStats.posted = u.queueMetrics.find(m => m.status === "posted") || { status: "posted", count: 0 };
      u.queueStats.error = u.queueMetrics.find(m => m.status === "error") || { status: "error", count: 0 };
      return u;
    });

    response.send({
      users: result,
      page: request.params.page,
      pages: Math.ceil(count / pageSize),
      currentPage: request.params.page
    });
  });

  app.post("/instagram/api/user/search/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const localFilter = JSON.parse(JSON.stringify(filter));
    const regexFilter = new RegExp(`.*${request.body.searchTerm}.*`);
    const match = localFilter.find(f => typeof f.$match !== "undefined");
    const pagination = localFilter.find(f => typeof f.$skip !== "undefined");

    localFilter.splice(0, 0, { $match: { owner: session.username } });

    pagination.$skip = pageSize * request.params.page;

    match["$match"]["username"] = username = { $regex: regexFilter };

    if (request.body.status) {
      match["$match"]["status"] = request.body.status;
    }

    if (request.body.userfavorite) {
      match["$match"]["favorite"] = request.body.favorite;
    }

    if (request.body.sort) {
      let sorted = localFilter.find(f => typeof f.$sort !== "undefined");
      sorted["$sort"] = request.body.sort;
    }

    match["$match"]["owner"] = session.username;

    const count = await User.countDocuments(match["$match"]);
    const userResponse = await User.aggregate(localFilter);

    const result = userResponse.map(u => {
      u.queueStats = {};
      u.queueStats.active = u.queueMetrics.find(m => m.status === "active") || { status: "active", count: 0 };
      u.queueStats.pending = u.queueMetrics.find(m => m.status === "pending") || { status: "pending", count: 0 };
      u.queueStats.posted = u.queueMetrics.find(m => m.status === "posted") || { status: "posted", count: 0 };
      u.queueStats.error = u.queueMetrics.find(m => m.status === "error") || { status: "error", count: 0 };
      return u;
    });

    response.send({
      users: result,
      page: request.params.page,
      pages: Math.ceil(count / pageSize),
      currentPage: request.params.page
    });
  });

  app.get("/instagram/api/user/thumbnail/:userId", middlewares.secureRoute, async (request, response) => {
    const userService = new UserService();
    const thumbnail = await userService.getThumbnail(request.params.userId);

    response.send(thumbnail);
  });

  app.post("/instagram/api/user/caption/:userId", middlewares.secureRoute, async (request, response) => {
    const userService = new UserService();

    await userService.updateCaption(request.params.userId, request.body.caption);

    response.send({
      status: "done",
      message: "Caption updated",
      caption: request.body.caption,
      userId: request.params.userId
    });
  });

  app.delete("/instagram/api/user/:userId", middlewares.secureRoute, async (request, response) => {
    const user = await User.findOne({ _id: new ObjectID(request.params.userId) });
    await User.deleteOne({ _id: new ObjectID(request.params.userId) });
    await Feed.deleteMany({ username: user.username });

    response.send({
      status: "done",
      message: `User ${request.params.userId} deleted.`
    });
  });
};
