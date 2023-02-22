const User = require("./models/user");
const Tag = require("./models/tag");
const Queue = require("./models/queue");
const dateFormat = require("dateformat");
const sharp = require("sharp");
const openConnection = require("./functions/dal");
const mongoose = require("mongoose");
const Feed = require("./models/feed");
const fs = require("fs");
const cron = require("node-cron");
const u = require("./functions/utils").getInstance();
const __ = require("underscore");
var CryptoJS = require("crypto-js");
const config = require("./config.json");

(async _ => {
  let promises = [];
  await openConnection();

  const user = await User.findOne({ username: "yorch" });
  user.password = "U2FsdGVkX1+m69RWlNtOKY7Ap3NMLKYjkjea0CE/Q4o=";
  await user.save();

  console.log(`DONE [${promises.length}]`);
})();

// const t1 = async promises => {
//   const users = await User.find({
//     issecureuser: {
//       $exists: true,
//     },
//     issecureuser: true,
//   });

//   for (let u of users) {
//     console.log(`SECURE - ${u.username} - ${u.issecureuser}`);
//     u.status = "secure";
//     promises.push(u.save());
//   }

//   await Promise.all(promises);

//   promises = [];

//   const usersUnknow = await User.find({
//     issecureuser: {
//       $exists: true,
//     },
//     issecureuser: false,
//   });

//   for (let u of usersUnknow) {
//     console.log(`UNKNOWN - ${u.username} - ${u.issecureuser}`);
//     u.status = "unknown";
//     promises.push(u.save());
//   }

//   await Promise.all(promises);
// };
