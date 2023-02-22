const u = require("../../functions/utils").getInstance();
const middlewares = require("../../functions/middlewares");
const logger = require("../../functions/eventService");
const Configuration = require("../../models/configuration");
var CryptoJS = require("crypto-js");

module.exports = params => {
  const app = params.app;

  app.get("/instagram/api/configuration/user/:id", middlewares.secureRoute, async (request, response) => {
    const user = await Configuration.findOne({ id: request.params.id, owner: request.session.data.username });
    const res = {};

    res.status = "done";

    if (user) {
      const bytes = CryptoJS.AES.decrypt(user.value, process.env.key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      res.user = { username: user.key, password: originalText };
    } else {
      res.user = { username: "", password: "" };
    }

    response.send(res);
  });

  app.get("/instagram/api/configuration/:id", middlewares.secureRoute, async (request, response) => {
    const conf = await Configuration.findOne({ id: request.params.id, owner: request.session.data.username });
    const res = {};

    res.status = "done";

    if (conf) {
      res.key = conf.key;
      res.value = conf.value;
      res.values = conf.values;
    } else {
      res.key = "";
      res.value = "";
      res.values = [];
    }

    response.send(res);
  });

  app.post("/instagram/api/configuration/:id", middlewares.secureRoute, async (request, response) => {
    const conf = await Configuration.findOne({ id: request.params.id, owner: request.session.data.username });
    let message = "";

    if (conf) {
      conf.value = request.body.value;
      conf.values = request.body.values || [];
      await conf.save();

      message = `Configuration item [${request.params.id}] updated.`;
      logger.tevent({ message, component: "configuration.js" });
    } else {
      const newUser = new Configuration({
        id: request.params.id,
        key: request.body.key,
        value: request.body.value,
        values: request.body.values || [],
        owner: request.session.data.username
      });

      await newUser.save();
      message = `Configuration item [${request.params.id}] created.`;
      logger.tevent({ message, component: "configuration.js" });
    }

    response.send({ status: "done", message });
  });

  app.post("/instagram/api/configuration/user/upsert", middlewares.secureRoute, async (request, response) => {
    const user = await Configuration.findOne({ id: request.body.id, owner: request.session.data.username });
    let message = "";

    const encryptPassword = CryptoJS.AES.encrypt(request.body.password, process.env.key).toString();

    if (user) {
      user.key = request.body.username;
      user.value = encryptPassword;
      message = `User [${user.key}] updated.`;

      await user.save();
      logger.tevent({ message, component: "configuration.js" });
    } else {
      const newUser = new Configuration({
        id: request.body.id,
        key: request.body.username,
        value: encryptPassword,
        owner: request.session.data.username
      });

      await newUser.save();
      message = `User [${request.body.username}] created.`;
      logger.tevent({ message, component: "configuration.js", user: { username: request.body.username, password: request.body.password } });
    }

    response.send({ status: "done", message });
  });

  app.get("/instagram/api/configuration/tags/get", middlewares.secureRoute, async (request, response) => {
    const tags = await Configuration.find({ id: "config_map_tags", owner: request.session.data.username });

    response.send({ status: "done", maptags: tags });
  });

  app.delete("/instagram/api/configuration/map/tags", middlewares.secureRoute, async (request, response) => {
    await Configuration.deleteOne({ id: "config_map_tags", key: request.body.key, owner: request.session.data.username });

    response.send({
      status: "done",
      message: await logger.event({
        message: `Tag set ${request.body.key} deleted`,
        component: "configuration.js"
      })
    });
  });

  app.post("/instagram/api/configuration/map/tags", middlewares.secureRoute, async (request, response) => {
    const key = request.body.key;
    const tags = request.body.tags;
    let message = "";

    const conf = await Configuration.findOne({ id: "config_map_tags", key: key, owner: request.session.data.username });

    if (conf && request.body.editmode) {
      conf.key = key;
      conf.values = tags;
      message = `Tag key '${key}' updated. `;
      await conf.save();
    } else if (!conf && !request.body.editmode) {
      const newTag = new Configuration({
        id: "config_map_tags",
        key: key,
        values: tags,
        owner: request.session.data.username
      });
      message = `Tag ${key} created.`;
      await newTag.save();
    } else {
      message = `Tag '${key}' already exist.`;
    }

    logger.tevent({ message, component: "configuration.js" });
    response.send({ status: "done", message });
  });
};
