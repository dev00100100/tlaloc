const Feed = require("../models/feed");
const User = require("../models/user");
const utils = require("../functions/utils");
const Service = require("./service");
const sharp = require("sharp");
const { ObjectID } = require("bson");

class Image extends Service {
  constructor() {
    super();
    this.default = {
      width: 180,
      height: 290
    };
  }

  async getThumbnails(feedId, params) {
    const promises = [];
    const feed = await Feed.findOne({ _id: new ObjectID(feedId) });

    const config = Object.assign(this.default, params);

    if (feed) {
      for (let f of feed.images) {
        promises.push(sharp(f.image).resize(config.width, config.height).toBuffer());
      }
    }

    return Promise.all(promises);
  }

  async getThumbnail(imageId, params) {
    const feed = await Feed.findOne({ "images._id": this.getObjectId(imageId) });
    const image = await this.getImage({ feedId: feed._id, imageId: imageId });

    const config = Object.assign(this.default, params);
    const thumbnail = await sharp(image.image.buffer).resize(config.width, config.height).toBuffer();

    return {
      imageId: image.imageId,
      feedId: image.feedId,
      username: image.username,
      thumbnail: thumbnail,
      tags: image.tags,
      code: image.code
    };
  }

  async getImage(params) {
    const image = await Feed.aggregate([
      {
        $match: {
          _id: this.getObjectId(params.feedId)
        }
      },
      {
        $unwind: "$images"
      },
      {
        $match: {
          "images._id": this.getObjectId(params.imageId)
        }
      },
      {
        $project: {
          feedId: "$_id",
          imageId: "$images._id",
          username: "$username",
          image: "$images.image",
          tags: "$tags",
          code: "$code"
        }
      }
    ]);

    return image[0];
  }

  async getImages(feedId) {
    const feed = await Feed.find({ _id: this.getObjectId(feedId) });
    const images = [];

    for (let image of feed.images) {
      images.push({
        feedId: feed._id,
        imageId: image._id,
        username: feed.username,
        image: image.image,
        tags: feed.tags,
        code: feed.code
      });
    }

    return images;
  }

  async delete(imageId) {
    const feed = await Feed.findOne({ "images._id": this.getObjectId(imageId) });
    const img = await this.getImage({ feedId: feed._id, imageId });

    return Feed.update(
      {
        _id: new ObjectID(img.feedId)
      },
      {
        $pull: {
          images: {
            _id: new ObjectID(img.imageId)
          }
        }
      }
    );
  }
}

module.exports = Image;
