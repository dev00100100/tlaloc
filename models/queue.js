"use strict";
const mongoose = require("mongoose");

const queue = mongoose.Schema({
  id: String,
  feedId: mongoose.Types.ObjectId,
  created: {
    type: Date,
    default: Date.now
  },
  posted: {
    type: Date
  },
  status: {
    type: String,
    default: "active"
  },
  priority: {
    type: Number,
    default: 10
  },
  username: String,
  caption: {
    type: String,
    default: ""
  },
  nextRunTime: {
    type: Date
  },
  type: {
    type: String,
    default: "normal"
  },
  offSet: Number,
  owner: String
});

const Queue = mongoose.model("Queue", queue);

module.exports = Queue;
