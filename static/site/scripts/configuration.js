var app = new Vue({
  el: "#configuration-manager",
  mixins: [shared],
  data: {
    tags: {
      maptags: [],
      showEditTags: false,
      key: "",
      tags: "",
      editmode: false,
    },
    posterUser: {
      username: "",
      password: "",
    },
    scrapperUser: {
      username: "",
      password: "",
    },
    queue: {
      cron: "",
      limit: "",
    },
  },
  created() {},
  mounted() {
    this.load();
  },
  computed: {},
  methods: {
    async applyQueue() {
      const self = this;

      await axios
        .all([
          axios.post(this.serviceUrl("/instagram/api/configuration/cron"), {
            key: "cron",
            value: this.queue.cron,
          }),
          axios.post(this.serviceUrl("/instagram/api/configuration/limit"), {
            key: "limit",
            value: this.queue.limit,
          }),
        ])
        .then(
          axios.spread(async function (cronResponse, limitResponse) {
            const response = cronResponse;

            await axios.post(self.serviceUrl("/instagram/api/queue/configuration/cron/setcron")).then((setCronResponse) => {
              response.data.message = cronResponse.data.message + " / " + limitResponse.data.message + " / " + setCronResponse.data.message;
              self.processResponseMesage(response);
            });
          })
        );
    },
    applyPoster() {
      const self = this;
      axios
        .post(this.serviceUrl("/instagram/api/configuration/user/upsert"), {
          id: "poster_user",
          username: self.posterUser.username,
          password: self.posterUser.password,
        })
        .then((response) => {
          self.processResponseMesage(response);
          self.load();
        });
    },
    applyScrapper() {
      const self = this;

      axios
        .post(this.serviceUrl("/instagram/api/configuration/user/upsert"), {
          id: "scrapper_user",
          username: self.scrapperUser.username,
          password: self.scrapperUser.password,
        })
        .then((response) => {
          self.processResponseMesage(response);
          self.load();
        });
    },
    addtags() {
      this.tags.key = "";
      this.tags.tags = [];
      this.tags.editmode = false;
      this.tags.showEditTags = true;
    },
    savetags() {
      const self = this;
      const key = this.tags.key;
      const tags = this.tags.tags
        .split(" ")
        .map((f) => f.trim())
        .filter((f) => f);

      axios.post(this.serviceUrl("/instagram/api/configuration/map/tags"), { key, tags, editmode: this.tags.editmode }).then((response) => {
        self.processResponseMesage(response);
        self.tags.showEditTags = false;
        self.load();
      });

      this.tags.editmode = false;
    },
    edittags(key) {
      const tagObject = this.tags.maptags.find((f) => f.key === key);

      this.tags.key = tagObject.key;
      this.tags.editmode = true;
      this.tags.tags = tagObject.values.reduce((t, c) => (t += ` ${c}`), " ").trim();
      this.tags.showEditTags = true;
    },
    removetags(key) {
      const self = this;
      console.log(key);
      axios.delete(this.serviceUrl("/instagram/api/configuration/map/tags"), { data: { key: key } }).then((response) => {
        self.processResponseMesage(response);
        this.tags.maptags.splice(
          this.tags.maptags.findIndex((f) => f.key === key),
          1
        );
      });
    },
    load() {
      const self = this;

      axios
        .all([
          axios.get(this.serviceUrl("/instagram/api/configuration/tags/get")),
          axios.get(this.serviceUrl("/instagram/api/configuration/user/poster_user")),
          axios.get(this.serviceUrl("/instagram/api/configuration/user/scrapper_user")),
          axios.get(this.serviceUrl("/instagram/api/configuration/cron")),
          axios.get(this.serviceUrl("/instagram/api/configuration/limit")),
        ])
        .then(
          axios.spread(function (tagsResponse, posterResponse, scrapperResponse, cronResponse, limitReponse) {
            self.tags.maptags = tagsResponse.data.maptags;
            self.posterUser = posterResponse.data.user;
            self.scrapperUser = scrapperResponse.data.user;
            self.queue.cron = cronResponse.data.value;
            self.queue.limit = limitReponse.data.value;
          })
        );
    },
  },
});
