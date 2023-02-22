const jwt = require("jsonwebtoken");
const logger = require("./eventService");
const LoginService = require("./loginService");

module.exports = {
  secureRoute: (req, res, next) => {
    const token = req.headers["authorization"];
    const loginService = new LoginService();

    try {
      const tokenObject = JSON.parse(loginService.getDecyptedText(token));

      if (tokenObject) {
        jwt.verify(tokenObject.token, process.env.key, (err, decoded) => {
          if (err) {
            return res.status(401).json({ mensaje: err.message });
          } else {
            req.decoded = decoded;
            req.session.data = { username: tokenObject.session.username, id: tokenObject.session.id };

            next();
          }
        });
      } else {
        res.status(401).send({ mensaje: "missing token" });
      }
    } catch (e) {
      logger.error({ message: e.message, stack: e.stack, component: __filename });
      res.status(401).send({ mensaje: "invalid token" });
    }
  }
};
