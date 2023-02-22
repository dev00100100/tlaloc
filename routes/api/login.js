const jwt = require("jsonwebtoken");
const User = require("../../models/user");
const logger = require("../../functions/eventService");
const CryptoJS = require("crypto-js");
const LoginService = require("../../functions/loginService");

module.exports = params => {
  const app = params.app;

  app.post("/instagram/site/admin/login", async (request, response) => {
    const loginService = new LoginService();
    const username = request.body.username;
    const user = await User.findOne({ username, type: "admin" });

    if (user) {
      const password = loginService.getDecyptedText(user.password);

	//console.log(password);

      if (request.body.password === password) {
        const payload = { check: true };
        const token = jwt.sign(payload, process.env.key, {
          expiresIn: process.env.prod ? "1h" : "12h"
        });

        request.session.data = { username, id: user._id };
        const encryptetToken = CryptoJS.AES.encrypt(JSON.stringify({ token, session: request.session.data }), process.env.key).toString();

        response.json({
          status: "done",
          token: encryptetToken
        });
      } else {
        logger.event({ message: `Attempting to login with incorrect password: ${username}`, component: "login.js" });
        response.status(401).json({ message: "user or password incorrect." });
      }
    } else {
      logger.event({ message: `Attempting to login with incorrect user ${username}`, component: "login.js" });
      response.status(401).json({ message: "user or password incorrect." });
    }
  });
};
