var app = new Vue({
  el: "#queue-manager",
  mixins: [shared],
  data: {
    queues: [],
    showimage: false,
    images: [],
    page: 0,
    pages: 0,
    currentPage: 0,
    tagsBehaivor: {
      showSpan: true,
      showInput: false
    },
    searchFilter: {
      searchTerm: "",
      status: "",
      type: ""
    },
    stats: {},
    modalData: {
      caption: {
        show: false,
        caption: "",
        queueId: ""
      }
    }
  },
  created() {
    document.onkeydown = evt => {
      evt = evt || window.event;
      if (evt.keyCode == 27 && this.showimage) {
        this.hideimages();
      }
    };
  },
  mounted() {
    this.reload();
  },
  computed: {
    galleryLink() {
      return (username, feedId) => {
        return this.serviceUrl(`/instagram/site/gallery?username=${username}&homePage=0&feed=${feedId}`);
      };
    },
    tagsFeed() {
      return feedId => {
        const queue = this.queues.find(q => q.feed.id == feedId);
        return queue.feed.tags.reduce((tagsString, tag) => {
          return (tagsString += `#${tag} `);
        }, " ");
      };
    }
  },
  methods: {
    editCaption(queueId) {
      const queue = this.queues.find(q => q.id === queueId);
      this.modalData.caption.caption = queue.caption;
      this.modalData.caption.queueId = queueId;
      this.modalData.caption.show = true;
    },
    onEditCaption() {
      const self = this;
      axios
        .post(this.serviceUrl(`/instagram/api/queue/caption/edit/${this.modalData.caption.queueId}`), { caption: this.modalData.caption.caption })
        .then(response => {
          let queue = this.queues.find(q => q.id === this.modalData.caption.queueId);
          queue.caption = this.modalData.caption.caption;
          this.modalData.caption.caption = "";
          this.modalData.caption.show = false;
          self.processResponseMesage(response);
        });
    },
    processQueueItem(queueId) {
      const self = this;

      this.showConfirm({
        title: "Confirm",
        message: "Post?",
        accept: _ => {
          axios.post(this.serviceUrl(`/instagram/api/queue/postqueueitem/${queueId}`)).then(response => {
            self.processResponseMesage(response);
          });
        },
        cancel: _ => {}
      });
    },
    updatePriority(queueId, priority) {
      let vm = this;
      axios.post(this.serviceUrl(`/instagram/api/queue/changepriority/${queueId}/${priority}`)).then(response => {
        vm.processResponseMesage(response);
      });
    },
    validateCharacteres($event) {
      if (!/[a-zA-Z0-9\_\s]/.test($event.key)) {
        $event.preventDefault();
      }
    },
    editTags(queueId, state) {
      let queue = this.queues.find(q => q.id == queueId);
      queue.edittag = state;

      this.$nextTick(() => {
        this.$refs[`tag_${queueId}`][0].focus();
      });

      if (!state) {
        const tags = this.$refs[`tag_${queueId}`][0].value;
        if (tags) {
          const vm = this;
          const tagsArray = tags.split(" ").filter(t => t);

          axios
            .post(this.serviceUrl(`/instagram/site/admin/tags/${queue.feed.id}`), {
              tags: tagsArray
            })
            .then(response => {
              const q = vm.queues.find(q => q.feed.id === response.data.feed._id);
              q.feed.tags = response.data.feed.tags;
              vm.processResponseMesage(response);
            });
        }
      }
    },
    search() {
      const vm = this;
      axios.post(this.serviceUrl(`/instagram/api/queue/search/${this.page}`, this.searchFilter), this.searchFilter).then(response => {
        vm.queues = response.data.queues.map(q => {
          q.edittag = false;
          return q;
        });
        vm.pages = parseInt(response.data.pages);
        vm.currentPage = parseInt(response.data.currentPage);
        vm.page = response.data.page;
      });
    },
    changeStatus(queueId) {
      let vm = this;
      axios.post(this.serviceUrl(`/instagram/api/queue/changestatus/${queueId}`)).then(response => {
        let queue = vm.queues.find(q => q.id == queueId);
        queue.status = response.data.state;
        vm.processResponseMesage(response);
        vm.getstats();
      });
    },
    changePage(p) {
      let vm = this;
      this.page = p;
      this.currentPage = p;
      if (this.searchFilter.searchTerm || this.searchFilter.status) {
        this.search();
      } else {
        axios.get(this.serviceUrl(`/instagram/api/queue/${this.page}`)).then(response => {
          vm.queues = response.data.queues.map(q => {
            q.edittag = false;
            return q;
          });
          vm.pages = response.data.pages;
          vm.currentPage = response.data.currentPage;
          vm.searchTerm = "";
        });
      }
    },
    showimages(feedId) {
      this.showimage = true;
      const vm = this;
      axios.get(this.serviceUrl(`/instagram/site/admin/thumnails/${feedId}`)).then(response => {
        vm.images = response.data;
      });
    },
    hideimages() {
      this.showimage = false;
      this.images = [];
    },
    remove(queueId) {
      let vm = this;
      if (confirm("Delete?")) {
        axios
          .delete(this.serviceUrl(`/instagram/api/queue/${queueId}`))
          .then(response => {
            let index = vm.queues.findIndex(i => i.id === queueId);
            vm.$delete(vm.queues, index);
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    getstats() {
      const self = this;
      axios.get(this.serviceUrl(`/instagram/api/queue/metrics/stats`)).then(response => {
        self.stats = response.data.stats;
      });
    },
    reload() {
      let vm = this;
      this.page = 0;

      Promise.all([axios.get(this.serviceUrl(`/instagram/api/queue/${this.page}`)), axios.get(this.serviceUrl(`/instagram/api/queue/metrics/stats`))]).then(
        ([queueResponse, statsResponse]) => {
          vm.queues = queueResponse.data.queues.map(q => {
            q.edittag = false;
            return q;
          });

          vm.pages = queueResponse.data.pages;
          vm.currentPage = queueResponse.data.currentPage;
          vm.searchFilter.searchTerm = "";
          vm.searchFilter.status = "";
          vm.searchFilter.type = "";

          vm.stats = statsResponse.data.stats;
        }
      );
    }
  }
});
