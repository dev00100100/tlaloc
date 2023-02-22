require("./config");
const User = require("./models/user");
const openConnection = require("./functions/dal");

const fs = require("fs");
const Configuration = require("./models/configuration");
const config = require("./config.json");
const Feed = require("./models/feed");
const Tag = require("./models/tag");
const Event = require("./models/event");
const Queue = require("./models/queue");

const argv = process.argv.slice(2);
const LOCAL_IP = argv[0];

const updateDomain = ip => {
  return new Promise((resolve, reject) => {
    fs.readFile("static/site/scripts/shared.js", "utf8", function (err, data) {
      const js = data.replace(/baseUrl:.+".*"/i, `baseUrl: "${ip}"`);

      fs.writeFile("static/site/scripts/shared.js", js, function (err) {
        if (err) reject(err);
        console.log("File udpated");
        resolve();
      });
    });
  });
};

const createTags = async _ => {
  const mapTags = config.mapTags;
  const promises = [];

  console.log(`maptags ${mapTags.length}`);

  for (let map of mapTags) {
    const exist = await Configuration.exists({ key: map.key });
    if (!exist) {
      const configuration = new Configuration({
        id: "config_map_tags",
        key: map.key,
        values: [...map.tags],
        type: ""
      });
      promises.push(configuration.save());
    }
  }

  await Promise.all(promises);
};

const createAdminUser = async _ => {
  const exists = await User.exists({ username: "yorch", type: "admin" });
  if (!exists) {
    const user = new User({
      username: "yorch",
      password: "U2FsdGVkX1+m69RWlNtOKY7Ap3NMLKYjkjea0CE/Q4o=",
      type: "admin"
    });
    await user.save();
  }

  const existNylon = await User.exists({ username: "nylon", type: "admin" });
  if (!existNylon) {
    const user = new User({
      username: "nylon",
      password: "U2FsdGVkX1+m69RWlNtOKY7Ap3NMLKYjkjea0CE/Q4o=",
      type: "admin"
    });
    await user.save();
  }
};

const setCron = async _ => {
  const exists = await Configuration.exists({ id: "cron" });

  if (!exists) {
    const cron = new Configuration({
      id: "cron",
      key: "cron",
      value: "0 4,12,18 * * *",
      values: []
    });

    await cron.save();
  }
};

const setLimit = async _ => {
  const exists = await Configuration.exists({ id: "limit" });

  if (!exists) {
    const limit = new Configuration({
      id: "limit",
      key: "limit",
      value: "2",
      values: []
    });

    await limit.save();
  }
};

const setOwner = async _ => {
  return Promise.all([
    User.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    User.createIndexes({ owner: 1 }),
    Feed.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    Feed.createIndexes({ owner: 1 }),
    Configuration.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    Configuration.createIndexes({ owner: 1 }),
    Event.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    Event.createIndexes({ owner: 1 }),
    Tag.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    Tag.createIndexes({ owner: 1 }),
    Queue.updateMany({ owner: null }, { $set: { owner: "yorch" } }),
    Queue.createIndexes({ owner: 1 })
  ]);
};

(async _ => {
  openConnection();

  console.log(`LOCAL IP: ${LOCAL_IP}:${config.PORT}`);
  await updateDomain(`${LOCAL_IP}:${config.PORT}`);

  //await createAdminUser();
  //await createTags();
  //await setCron();
  //await setLimit();
  //await setOwner();

  console.log(`POST SCRIPT DONE`);
  process.exit(1);
})();
