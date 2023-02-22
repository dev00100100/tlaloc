"use strict";
const mongoose = require("mongoose");

const eventSchema = mongoose.Schema({
  id: String,
  type: String,
  message: String,
  component: String,
  stack: String,
  created: {
    type: Date,
    default: Date.now
  },
  owner: String
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
