const socket = require("socket.io");

let io;

module.exports = function(server) {
  if (server) {
    io = socket(server);
  }
  return io;
};