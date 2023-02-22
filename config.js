"use strict";
const config = require("./config.json");

process.database = config.database;

process.mongoose = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
};

process.env.prod = config.prod || false;
process.env.key = config.key;
process.env.ADDRESS = config.address;
process.env.PROTOCOL = config.PROTOCOL;

process.env.PORT = process.env.PORT || config.PORT;
