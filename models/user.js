"use strict";
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  id: String,
  username: String,
  created: {
    type: Date,
    default: Date.now
  },
  thumbnail: Buffer,
  favorite: {
    type: Boolean,
    default: false
  },
  issecureuser: {
    type: Boolean,
    default: false
  },
  publishedCount: Number,
  status: {
    type: String,
    enum: ["secure", "notsecure", "unknown", "sharer"],
    default: "unknown"
  },
  caption: {
    type: String,
    default: `CN [[USERNAME]]
        
        
        [[TAGS]]`
  },
  type: String,
  password: String,
  owner: String,
  session: String
});

const User = mongoose.model("User", userSchema);

module.exports = User;
