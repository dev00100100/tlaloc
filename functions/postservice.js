const axios = require("axios");
const xpath = require("xpath-html");

class scrapper {
  constructor() {}

  async scrap(config) {
    try {
      let html = await this.getHtml(config.uri);
      let nodes = xpath.fromPageSource(html.data).findElements(config.xpath);

      return nodes;
    } catch (e) {
      console.error(`EXEPTION-> ${e.message} - ${config.uri}`);
      return [];
    }
  }

  getHtml(uri) {    
    return axios.get(uri, {
      timeout: (1000 * 30),
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36 Edg/83.0.478.61",
    });
  }

  getImage(uri) {
    return axios.get(uri, {
      responseType: "arraybuffer",
      timeout: (1000 * 30),
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36 Edg/83.0.478.61"
    });
  }
}

module.exports = scrapper;
