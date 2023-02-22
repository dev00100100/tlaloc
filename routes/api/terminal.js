const Event = require("../../models/event");
const logger = require("../../functions/eventService");
const dateFormat = require("dateformat");
const middlewares = require("../../functions/middlewares");

module.exports = params => {
  const app = params.app;

  app.get("/instagram/api/terminal", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    const terminalEvents = await Event.find({ type: "TERMINAL", owner: session.username }).sort({ created: 1 });
    const format = "dd/mm/yy h:MM:ss";
    const res = terminalEvents.map(t => {
      const date = dateFormat(new Date(t.created), format).toString();
      return {
        id: t.id,
        message: t.message,
        date,
        component: t.component,
        created: t.created
      };
    });

    response.send({ status: "done", events: res });
  });

  app.delete("/instagram/api/terminal", middlewares.secureRoute, async (request, response) => {
    const session = request.session.data;
    await Event.remove({ type: "TERMINAL", owner: session.username });

    response.send({ status: "done", message: "terminal events deleted." });
  });
};
