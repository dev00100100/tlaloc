"use strict";
const mongoose = require("mongoose");

const imageSchema = mongoose.Schema({
  id: String,
  pk: String,
  image: Buffer,
  url: String,
  created: {
    type: Date,
    default: Date.now
  },
  width: Number,
  height: Number,
  size: Number,
  favorite: {
    type: Boolean,
    default: false
  },
  thumbnail: Buffer
});

const feedSchema = mongoose.Schema({
  id: String,
  pk: String,
  created: {
    type: Date,
    default: Date.now
  },
  code: String,
  username: String,
  user: String,
  favorite: {
    type: Boolean,
    default: false
  },
  thumbnail: String,
  images: {
    type: [imageSchema],
    default: undefined
  },
  tags: Array,
  publishedCount: Number,
  caption: {
    type: String,
    default: ""
  },
  owner: String
});

const Feed = mongoose.model("Feed", feedSchema);

module.exports = Feed;
