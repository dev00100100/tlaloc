const Instagram = require("./instagram");
const User = require("../models/user");
const Service = require("./service");
const logger = require("./eventService");
const u = require("./utils").getInstance();
const { ObjectID } = require("bson");

class UserService extends Service {
  constructor() {
    super();
  }

  async getUsers() {
    const users = await User.find({});
    return users;
  }

  async getUsers(filter) {
    const users = await User.find(filter);
    return users;
  }

  async getUserPerPage(params) {
    const filter = params.filter ? params.filter : {};
    const pageSize = params.pageSize;
    const page = params.page;
    const count = await User.countDocuments(filter);
    const pages = Math.ceil(count / pageSize);

    const users = await User.find(filter)
      .sort(params.orderBy)
      .skip(pageSize * page)
      .limit(pageSize);

    return {
      users,
      pages
    };
  }

  async getThumbnail(userId) {
    const user = await User.findOne({ _id: new ObjectID(userId) });
    return `data:image/png;base64, ${user.thumbnail.toString("base64")}`;
  }

  async updateCaption(userId, caption) {
    const user = await User.findOne({ _id: new ObjectID(userId) });
    user.caption = caption;
    return user.save();
  }
}

module.exports = UserService;
