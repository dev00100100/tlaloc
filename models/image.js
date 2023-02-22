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
  thumbnail: Buffer
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
