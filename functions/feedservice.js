const Feed = require("../models/feed");
const Configuration = require("../models/configuration");
const { ObjectID } = require("bson");
const Service = require("./service");

class FeedService extends Service {
  constructor() {
    super();
    this.tagMaps = process.mapTags;
  }

  async getfeed(feedId) {
    return Feed.findOne({ _id: new ObjectID(feedId) });
  }

  async settag(params) {
    const tag = params.tag;
    const feed = await this.getfeed(params.feedId);
    const mapTag = await Configuration.findOne({ id: "config_map_tags", key: tag });

    if (feed.tags.some(t => t === tag)) {
      feed.tags.remove(tag);
      if (mapTag) {
        for (let t of mapTag.values) {
          feed.tags.remove(t);
        }
      }
    } else {
      feed.tags.push(tag);
      if (mapTag) {
        for (let t of mapTag.values) {
          if (!feed.tags.some(ts => ts === t)) {
            feed.tags.push(t);
          }
        }
      }
    }

    return feed.save();
  }

  async settags(params) {
    const feed = await this.getfeed(params.feedId);
    feed.tags = [];
    feed.tags = params.tags;

    return feed.save();
  }

  async getFeedByImageId(imageId) {
    console.log(imageId);
    const feed = await Feed.findOne({ "images._id": new ObjectID(imageId) });
    return feed;
  }

  async isFeedEmpty(feedId) {
    const feed = await Feed.findOne({ _id: this.getObjectId(feedId) });

    return feed.images.length === 0;
  }

  async deleteFeed(feedId) {
    return Feed.deleteOne({ _id: this.getObjectId(feedId) });
  }
}

module.exports = FeedService;
