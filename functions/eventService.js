const Event = require("../models/event");
const Service = require("./service");
const path = require("path");
const { ObjectID } = require("bson");
const { extend } = require("underscore");
const dateFormat = require("dateformat");
const u = require("../functions/utils").getInstance();

class EventService extends Service {
  constructor() {
    super();
    this.format = "dd/mm/yy h:MM:ss TT";
    this.owner = "";
  }

  async log(params) {
    if (typeof params === "string") {
      const temp = params;
      params = {};
      params.message = temp;
      params.component = "";
    }
    params.type = "INFO";
    params.display = true;
    this.createLog(params);
  }

  async tevent(params) {
    this.event(params);
    params.display = false;
    this.terminal(params);
  }
  async event(params) {
    params.type = "EVENT";
    params.save = true;
    this.createLog(params);
    return params.message;
  }
  async error(params) {
    params.type = "ERROR";
    params.save = true;
    this.createLog(params);
    return params.message;
  }

  async terminal(params) {
    params.type = "TERMINAL";
    params.save = true;
    this.createLog(params);
    return params.message;
  }

  async createLog(params) {
    if (params) {
      const time = new Date();
      params.display = typeof params.display === "undefined" ? true : params.display;

      if (params.component && !!path.extname(params.component)) {
        params.component = path.basename(params.component);
      }

      params.component = params.component || "";
      params.message = params.message || "";
      params.stack = params.stack || "";
      params.owner = params.owner || "";

      if (params.type == "ERROR") {
        console.log(`[${dateFormat(time, this.format)}][${params.owner}][${params.type}][${params.component}] - ${params.message}\n${params.stack}`);
      } else if (params.display) {
        console.log(`[${dateFormat(time, this.format)}][${params.owner}][${params.type}][${params.component}] - ${params.message}`);
      }

      if (params.save) {
        this.save(params);
      }
    }
  }

  async save(params) {
    const event = new Event({
      id: u.guid(),
      type: params.type,
      message: params.message || "",
      stack: params.stack || "",
      component: params.component || "",
      owner: params.owner
    });

    return event.save();
  }
}

module.exports = new EventService();
