const { ObjectID } = require("bson");
class Service {
  constructor() {}

  getObjectId(id) {
    if (typeof id === "string") {
      return new ObjectID(id);
    } else {
      return id;
    }
  }
}

module.exports = Service;
