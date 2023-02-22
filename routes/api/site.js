const utils = require("../../functions/utils");
const Feed = require("../../models/feed");
const User = require("../../models/user");
const Tag = require("../../models/tag");
const Queue = require("../../models/queue");
const UserService = require("../../functions/userservice");
const FeedService = require("../../functions/feedservice");
const { ObjectID } = require("bson");
const Image = require("../../functions/image");
const middlewares = require("../../functions/middlewares");
const logger = require("../../functions/eventService");
const u = utils.getInstance();

module.exports = params => {
  const app = params.app;
  const io = params.io;
  const pageSize = 20;

  const filter = [
    { $match: { type: "model" } },
    { $sort: { favorite: -1, username: 1 } },
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
        size: { $sum: { $size: { $ifNull: ["$feeds.images", []] } } },
        status: { $push: "$queues.status" },
        thumbnail: { $first: "$thumbnail" }
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
        },
        thumbnail: { $first: "$thumbnail" }
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
        },
        thumbnail: { $first: "$thumbnail" }
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
        queueMetrics: "$status",
        thumbnail: "$thumbnail"
      }
    }
  ];

  app.get("/instagram/site/admin/galleries/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const page = request.params.page;
    const count = await User.countDocuments({ owner: session.username });
    const pages = Math.ceil(count / pageSize);
    const localFilter = JSON.parse(JSON.stringify(filter));

    const ownerFilter = { $match: { owner: session.username } };

    localFilter.splice(0, 0, ownerFilter);
    const pagination = localFilter.find(f => typeof f.$skip !== "undefined");

    pagination.$skip = pageSize * request.params.page;

    let galleries = await User.aggregate(localFilter).sort({ username: 1, favorite: -1 });

    let galleriesWithThumbnail = galleries.map(g =>
      (gallery => {
        return {
          id: gallery._id,
          username: gallery.username,
          thumbnail: `data:image/png;base64, ${gallery.thumbnail.toString("base64")}`,
          favorite: gallery.favorite || false,
          status: gallery.status || "unknown",
          queueStatus: gallery.queueMetrics.map(m => m.status).sort((a, b) => (a > b ? -1 : 1)),
          size: gallery.size,
          queueStats: {
            active: gallery.queueMetrics.find(m => m.status === "active") || { status: "active", count: 0 },
            pending: gallery.queueMetrics.find(m => m.status === "pending") || { status: "pending", count: 0 },
            posted: gallery.queueMetrics.find(m => m.status === "posted") || { status: "posted", count: 0 },
            error: gallery.queueMetrics.find(m => m.status === "error") || { status: "error", count: 0 }
          }
        };
      })(g)
    );

    response.send({
      galleries: galleriesWithThumbnail,
      pages: pages,
      currentPage: parseInt(page)
    });
  });

  app.post("/instagram/site/admin/galleries/:page/:search", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const regex = `.*${request.params.search}.*`;
    const localFilter = JSON.parse(JSON.stringify(filter));
    const regexExpression = new RegExp(regex);
    const pageSize = 20;
    const page = request.params.page;
    const count = await User.countDocuments({ username: regexExpression, owner: session.username });
    const pages = Math.ceil(count / pageSize);

    const match = { $match: { username: { $regex: regex }, owner: session.username } };

    localFilter.splice(1, 0, match);

    const pagination = localFilter.find(f => typeof f.$skip !== "undefined");
    pagination.$skip = pageSize * request.params.page;

    let galleries = await User.aggregate(localFilter).sort({ username: 1, favorite: -1 });

    let galleriesWithThumbnail = galleries.map(g =>
      (gallery => {
        return {
          id: gallery._id,
          username: gallery.username,
          thumbnail: `data:image/png;base64, ${gallery.thumbnail.toString("base64")}`,
          favorite: gallery.favorite || false,
          status: gallery.status || "unknown",
          queueStatus: gallery.queueMetrics.map(m => m.status).sort((a, b) => (a > b ? -1 : 1)),
          size: gallery.size,
          queueStats: {
            active: gallery.queueMetrics.find(m => m.status === "active") || { status: "active", count: 0 },
            pending: gallery.queueMetrics.find(m => m.status === "pending") || { status: "pending", count: 0 },
            posted: gallery.queueMetrics.find(m => m.status === "posted") || { status: "posted", count: 0 }
          }
        };
      })(g)
    );

    response.send({
      galleries: galleriesWithThumbnail,
      pages: pages,
      currentPage: parseInt(page)
    });
  });

  app.get("/instagram/site/admin/gallery/:username/:page/:feedId", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const filter = { $match: { _id: new ObjectID(request.params.feedId), owner: session.username } };
    search(request, response, filter);
  });

  app.get("/instagram/site/admin/gallery/:username/:page", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const filter = { $match: { username: request.params.username, owner: session.username } };
    console.log(filter);
    search(request, response, filter);
  });

  const search = async (request, response, filter) => {
    const pageSize = 20;
    const page = request.params.page;
    const totalSizeObject = await Feed.aggregate([
      filter,
      { $unwind: "$images" },
      {
        $project: {
          "images._id": 1,
          _id: 1,
          image: "$images.thumbnail",
          tags: 1
        }
      },
      {
        $project: {
          imageId: "$images._id",
          feedId: "$_id",
          image: 1,
          tags: 1
        }
      },
      {
        $lookup: {
          from: "queues",
          localField: "imageId",
          foreignField: "feedId",
          as: "queue"
        }
      },
      {
        $unwind: {
          path: "$queue",
          preserveNullAndEmptyArrays: true
        }
      },
      { $count: "count" }
    ]);

    const totalSize = totalSizeObject[0].count;
    const user = await User.findOne({ username: request.params.username });

    let queueStats = await Queue.aggregate([
      {
        $lookup: {
          from: "feeds",
          localField: "feedId",
          foreignField: "_id",
          as: "feeds"
        }
      },
      {
        $match: { "feeds.username": request.params.username }
      },
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

    let gallery = await Feed.aggregate([
      filter,
      { $unwind: "$images" },
      {
        $project: {
          "images._id": 1,
          _id: 1,
          image: "$images.thumbnail",
          tags: 1
        }
      },
      {
        $project: {
          imageId: "$images._id",
          feedId: "$_id",
          image: 1,
          tags: 1
        }
      },
      {
        $lookup: {
          from: "queues",
          localField: "feedId",
          foreignField: "feedId",
          as: "queue"
        }
      },
      {
        $unwind: {
          path: "$queue",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          imageId: 1,
          feedId: 1,
          image: 1,
          queue: "$queue",
          tags: 1,
          id: "$imageId"
        }
      }
    ])
      .skip(page * pageSize)
      .limit(pageSize);

    const pages = Math.ceil(totalSize / pageSize);

    logger.terminal({ message: `[ Page: ${page} ] [ Total: ${totalSize} ] [ Pages: ${pages} ] `, component: "site.js" });

    let galleryImage = gallery.map(g => {
      return {
        id: g.id,
        feedId: g.feedId,
        thumbnail: g.image ? `data:image/png;base64, ${g.image.toString("base64")}` : "",
        queueStatus: g.queue ? g.queue.status : "notqueue",
        tags: g.tags ? g.tags : []
      };
    });

    let tempNode = null;
    for (let node of galleryImage) {
      if (!tempNode) {
        node.p = null;
      } else {
        node.p = { imageId: tempNode.id, feedId: tempNode.feedId };
        tempNode.n = { imageId: node.id, feedId: node.feedId };
      }
      tempNode = node;
    }

    const galleriesImages = galleryImage.map(g => {
      return {
        id: g.id,
        thumbnail: g.thumbnail,
        tags: g.tags || [],
        p: g.p,
        n: g.n,
        queueStatus: g.queueStatus,
        feedId: g.feedId
      };
    });

    response.send({
      status: "done",
      galleries: galleriesImages,
      pages: pages,
      currentPage: parseInt(page),
      userstatus: user.status,
      queueStats: {
        active: queueStats.find(m => m.status === "active") || { status: "active", count: 0 },
        pending: queueStats.find(m => m.status === "pending") || { status: "pending", count: 0 },
        posted: queueStats.find(m => m.status === "posted") || { status: "posted", count: 0 },
        error: queueStats.find(m => m.status === "error") || { status: "error", count: 0 }
      }
    });
  };

  app.get("/instagram/site/admin/image/:feedId/:imageId", middlewares.secureRoute, async (request, response) => {
    const image = new Image();
    const img = await image.getImage({ feedId: request.params.feedId, imageId: request.params.imageId });

    response.send({
      image: `data:image/png;base64, ${img.image.toString("base64")}`,
      tags: img.tags,
      code: img.code
    });
  });

  app.delete("/instagram/site/admin/image/:imageId", middlewares.secureRoute, async (request, response) => {
    const image = new Image();
    await image.delete(request.params.imageId);

    response.send({
      status: "done",
      message: `Image deleted '${request.params.imageId}'`
    });
  });

  app.post("/instagram/site/admin/setthumbnail/:imageId", middlewares.secureRoute, async (request, response) => {
    const image = new Image();
    const thumbnail = await image.getThumbnail(request.params.imageId, { width: 180, height: 290 });

    await User.updateOne({ username: thumbnail.username }, { thumbnail: thumbnail.thumbnail });

    response.send({
      status: "done",
      message: `Image '${request.params.imageId}' set as main thumbnail`
    });
  });
  app.post("/instagram/site/admin/setfavoriteuser/:username", middlewares.secureRoute, async (request, response) => {
    let user = await User.findOne({ username: request.params.username });

    user.favorite = !user.favorite;
    await user.save();

    response.send({
      status: "done",
      message: `User '${request.params.username}' set favorite to ${user.favorite}`
    });
  });

  app.post("/instagram/site/admin/tags", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const tags = request.body.tags;
    console.log(request.body.tags);

    for (let t of tags) {
      let tag = new Tag({
        id: u.guid(),
        name: t,
        owner: session.username
      });

      const exist = await Tag.exists({
        name: t,
        owner: session.username
      });

      if (!exist) {
        await tag.save();
      } else {
        console.log(`'${t}' exist.`);
      }
    }

    const tagsResponse = await Tag.find({ owner: session.username });

    response.send({
      status: "done",
      message: `'${tags[0]}' added`,
      tags: tagsResponse.map(t => t.name)
    });
  });

  app.delete("/instagram/site/admin/tags", middlewares.secureRoute, async (request, response) => {
    const tags = request.body.tags;

    await Promise.all(
      tags.map(t =>
        Tag.findOneAndDelete({
          name: t
        })
      )
    );

    response.send({
      status: "done",
      message: ""
    });
  });

  app.post("/instagram/site/admin/tags/:feedId/:tag", middlewares.secureRoute, async (request, response) => {
    const feedService = new FeedService();
    const tag = request.params.tag;
    const feed = await feedService.settag({ feedId: request.params.feedId, tag: tag });

    response.send({
      status: "done",
      message: "",
      tags: feed.tags
    });
  });

  app.get("/instagram/site/admin/tags", middlewares.secureRoute, async (request, response) => {
    let tags = await Tag.find({ owner: request.session.data.username });
    response.send({
      status: "done",
      message: "",
      tags: tags.map(t => t.name)
    });
  });

  app.post("/instagram/site/admin/setsecure/:username/:status", middlewares.secureRoute, async (request, response) => {
    let user = await User.findOne({
      username: request.params.username,
      owner: request.session.data.username
    });
    user.status = request.params.status;
    await user.save();
    response.send({
      status: "done",
      message: `${user.username} set as '${user.status}' user.`,
      userstatus: user.status
    });
  });

  app.get("/instagram/site/admin/thumnails/:feedId", middlewares.secureRoute, async (request, response) => {
    const image = new Image();
    const images = await image.getThumbnails(request.params.feedId, {
      width: 180,
      height: 290
    });

    response.send(
      images.map(i => ({
        thumbnail: `data:image/png;base64, ${i.toString("base64")}`
      }))
    );
  });

  app.post("/instagram/site/admin/tags/:feedId", middlewares.secureRoute, async (request, response) => {
    const feed = new FeedService();
    const tags = request.body.tags;

    const feedresult = await feed.settags({
      feedId: request.params.feedId,
      tags: tags
    });

    response.send({
      status: "done",
      message: "Tags updated.",
      feed: feedresult
    });
  });

  //search the available models for the current user
  app.get("/instagram/site/admin/users/:search", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const userservice = new UserService();
    const filter = new RegExp(`.*${request.params.search}.*`);

    const users = await userservice.getUsers({ username: filter, owner: session.username });

    response.send(
      users.map(u => {
        u.thumbnail = null;
        return u;
      })
    );
  });

  //change the feed of user
  app.post("/instagram/site/admin/users/changeuser/:imageId/:targetUser", middlewares.secureRoute, async (request, response) => {
    const feedservice = new FeedService();

    const feed = await feedservice.getFeedByImageId(request.params.imageId);
    const previousUser = feed.username;
    feed.username = request.params.targetUser;
    await feed.save();
    response.send({ status: "done", message: `Feed changed from ${previousUser} to ${feed.username}.` });
  });
};
