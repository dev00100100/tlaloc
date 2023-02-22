function utility() {
  let self = this;

  self.guid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  self.splitArray = async (array, size) => {
    let result = [];
    while (array.length) {
      result.push(array.splice(0, size));
    }
    return result;
  };

  self.sleep = ms => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  self.GetFilename = async url => {
    if (url) {
      var m = url.toString().match(/.*\/(.+?)\./);
      if (m && m.length > 1) {
        return m[1];
      }
    }
    return "";
  };

  self.groupBy = async (objectArray, property) => {
    return objectArray.reduce(function (acc, obj) {
      var key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  };
}

utility.instance = null;
utility.socket = null;
utility.io = null;

utility.getInstance = _ => {
  if (!utility.instance) {
    utility.instance = new utility();
  }

  return utility.instance;
};

module.exports = utility;
