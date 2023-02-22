const User = require("../models/user");
const logger = require("./eventService");
const Configuration = require("../models/configuration");
const Service = require("./service");
var CryptoJS = require("crypto-js");
const { ObjectID } = require("bson");

class LoginService extends Service {
  constructor(owner) {
    super();
    this.owner = owner;
  }
  async getConfigurationUser(id) {
    console.log(id, this.owner);
    const user = await Configuration.findOne({ id, owner: this.owner });

    const originalText = this.getDecyptedText(user.value);
    return { username: user.key, password: originalText };
  }

  getDecyptedText(text) {
    const bytes = CryptoJS.AES.decrypt(text, process.env.key);    
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

module.exports = LoginService;
