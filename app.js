const express = require("express");
const openConnection = require("./functions/dal");
const cors = require("cors");
const app = express();
const fileUpload = require("express-fileupload");
const QueueService = require("./functions/queueservice");
const logger = require("./functions/eventService");
const https = require("https");
const fs = require("fs");
const session = require("express-session");
const User = require("./models/user");
require("./config");

const options = {
  key: fs.readFileSync("./certificates/key.pem"),
  cert: fs.readFileSync("./certificates/cert.pem")
};

app.set("key", process.env.key);
app.use(express.json());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(fileUpload({ createParentPath: true }));
app.use(
  session({
    secret: process.env.key,
    resave: true,
    saveUninitialized: true
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.use(cors());
app.options("*", cors());

app.use(express.static("static/site/scripts"));
app.use(express.static("static/site/components"));
app.use(express.static("static/site/styles"));

require("./routes/api/post")({ app });
require("./routes/site/index")({ app });
require("./routes/api/site")({ app });
require("./routes/api/queue")({ app });
require("./routes/api/feed")({ app });
require("./routes/api/upload")({ app });
require("./routes/api/user")({ app });
require("./routes/api/login")({ app });
require("./routes/api/terminal")({ app });
require("./routes/api/configuration")({ app });

app.use((err, request, response, next) => {
  const { statusCode, message } = err;
  logger.error({ message: `EXCEPTION: ${message}\n${err.stack}`, component: "errorhandler" });
  response.status(statusCode).send({ status: "error", message: message });
});

https.createServer(options, app).listen(process.env.PORT, _ => {
  openConnection().then(async _ => {
    logger.log({ message: `App Listening on Port: ${process.env.PORT}`, component: `app.js` });
    logger.log({ message: `Prod: ${process.env.prod}`, component: `app.js` });

    const queue = new QueueService();

    const users = await User.find({ type: "admin" });

    if (users) {
      for (const user of users) {
        queue.setCronJob(user.username);
      }
    }

    queue.createJob();
  });
});
