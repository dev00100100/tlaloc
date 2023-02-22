"use strict";
const mongoose = require("mongoose");

const configSchema = mongoose.Schema({
  id: String,
  key: String,
  value: String,
  values: [],
  type: String,
  created: {
    type: Date,
    default: Date.now
  },
  owner: String
});

const Configuration = mongoose.model("Configuration", configSchema);

module.exports = Configuration;
