const mongoose = require("mongoose");
require('../config');

const address = `mongodb://${process.database.address}:${process.database.port}/${process.database.name}`;

const openConnection = async () => {
  mongoose.connect(address, process.mongoose);
  mongoose.connection.on("open", _ => console.log("connected"));
  mongoose.connection.on("error", err => console.error(err));
};

module.exports = openConnection;
