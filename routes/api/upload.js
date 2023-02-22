const utils = require("../../functions/utils");
const Feed = require("../../models/feed");
const User = require("../../models/user");
const sharp = require("sharp");
const middlewares = require("../../functions/middlewares");
const { ObjectID } = require("bson");
const u = utils.getInstance();
const logger = require("../../functions/eventService");

module.exports = params => {
  const app = params.app;

  app.post("/instagram/api/upload/:username", middlewares.secureRoute, async (request, response) => {
    let files = [];
    const username = request.params.username;
    console.log(username);

    if (request.files) {
      let fileKeys = Object.keys(request.files);

      fileKeys.forEach(function (key) {
        files.push(request.files[key]);
        logger.terminal({
          message: `file => ${request.files[key].name} [${request.files[key].size}]`,
          component: "upload.js"
        });
      });

      await createUser(username, files[0].data);

      let feeddto = {
        id: u.guid(),
        pk: u.guid(),
        code: `UPL${u.guid().substring(0, 10)}`,
        username: username,
        user: username,
        thumbnail: "",
        images: []
      };

      for (let file of files) {
        const image = sharp(file.data);
        let metadata = await image.metadata();
        let imagedto = {
          id: u.guid(),
          image: file.data,
          url: "",
          width: metadata.width,
          height: metadata.height,
          size: file.size
        };
        feeddto.images.push(imagedto);
      }

      let feeddb = new Feed(feeddto);
      console.log(feeddb);
      await feeddb.save();
    }
    response.send({
      status: "done",
      message: "upload",
      files: files.map(f => ({
        name: f.name,
        size: f.size
      }))
    });
  });

  const createUser = async (username, image) => {
    let exists = await User.exists({
      username: username
    });
    if (!exists) {
      let user = new User({
        id: u.guid(),
        username: username,
        thumbnail: await sharp(image).resize(180, 290).toBuffer()
      });
      return user.save();
    }
  };
};
