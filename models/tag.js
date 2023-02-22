"use strict";
const mongoose = require("mongoose");

const userTag = mongoose.Schema({
  id: String,
  name: String,
  created: {
    type: Date,
    default: Date.now
  },
  owner: String
});

const Tag = mongoose.model("Tag", userTag);

module.exports = Tag;
