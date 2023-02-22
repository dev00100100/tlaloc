const path = require("path");
const fs = require("fs");

module.exports = params => {
  const app = params.app;
  const getHTML = htmlData => {
    let preHTML = htmlData.toString();
    const urlHTML = preHTML.replace(/{{ADDRESS}}/gm, `${process.env.ADDRESS}:${process.env.PORT}`);
    const html = urlHTML.replace(/{{PROTOCOL}}/gm, `${process.env.PROTOCOL}`);
    return html;
  };
  app.get("/instagram/site/home", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/index.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/gallery", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/gallery.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/image", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/image.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/queue", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/queue.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/feeds", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/feeds.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/upload", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/upload.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/users", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/users.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });

  app.get("/instagram/site/login", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/login.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });
  app.get("/instagram/site/configuration", async (request, response) => {
    fs.readFile(path.join(__dirname, "../../static/site", "/configuration.html"), (err, data) => {
      response.send(getHTML(data));
    });
  });
};
