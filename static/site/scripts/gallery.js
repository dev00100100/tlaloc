var app = new Vue({
  el: "#gallery",
  mixins: [shared],
  data: {
    galleries: [],
    imageId: "",
    currentPage: 0,
    showDivImage: false,
    smallSize: true,
    image: "",
    pages: 0,
    homePage: 0,
    page: 0,
    username: "",
    imageState: {
      tags: []
    },
    tags: [],
    keyMap: [],
    status: "unknown",
    imageSize: {
      width: 130,
      height: 200
    },
    isCreatingFeed: false,
    feed: [],
    thumbnail: "",
    thumbnailIsActive: false,
    thumbnailPosition: {
      top: 0,
      left: 0
    },
    feedId: null,
    code: {
      currentCode: "",
      oldCurrentCode: ""
    },
    showModal: false,
    modal: {
      users: [],
      currentUser: "",
      search: "",
      imageId: ""
    },
    queueStats: {
      active: {
        count: 0
      },
      pending: {
        count: 0
      },
      posted: {
        count: 0
      },
      error: {
        count: 0
      }
    },
    priorityQueue: {
      feeedId: "",
      show: false,
      cron: "* * * * *",
      caption: "[[USERNAME]]\n\n[[TAGS]]",
      time: {
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getUTCFullYear()
      }
    }
  },
  mounted() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.username = params.get("username");
    this.homePage = params.get("homePage");
    this.feedId = params.get("feed");
    let vm = this;
    let url = "";

    if (this.feedId) {
      url = this.serviceUrl(`/instagram/site/admin/gallery/${this.username}/0/${this.feedId}`);
    } else {
      url = this.serviceUrl(`/instagram/site/admin/gallery/${this.username}/0`);
    }

    axios
      .get(url)
      .then(response => {
        vm.galleries = response.data.galleries;
        vm.pages = response.data.pages;
        vm.currentPage = response.data.currentPage;
        vm.status = response.data.userstatus;
        console.log(response.data);
        vm.queueStats = response.data.queueStats;
      })
      .catch(e => console.log(e));

    axios
      .get(this.serviceUrl(`/instagram/site/admin/tags`))
      .then(response => {
        vm.tags = response.data.tags;
      })
      .catch(e => console.log(e));

    window.addEventListener("keypress", function (e) {
      if (vm.showDivImage && !vm.showModal) {
        switch (e.keyCode) {
          case 97: //a
            if (vm.imageState.p) {
              vm.showImage(null, vm.imageState.p);
            }
            break;
          case 100: //d
            if (vm.imageState.n) {
              vm.showImage(null, vm.imageState.n);
            }
            break;
          case 115: //s
            vm.hideImage();
            break;
          case 113: //q
            vm.deleteImage(vm.imageState.id);
            break;
        }

        let tag = null;
        if (e.keyCode >= 49 && e.keyCode <= 57) {
          tag = vm.tags[e.keyCode - 49];
        } else if (e.keyCode == 48) {
          tag = vm.tags[9];
        }
        if (tag) {
          vm.setTag(tag);
        }
      } else if (!vm.showModal) {
        switch (e.keyCode) {
          case 97: //a
            if (vm.currentPage - 1 >= 0) {
              vm.changePage(vm.currentPage - 1);
            }
            break;
          case 100: //d
            if (vm.currentPage + 1 <= vm.pages - 1) {
              vm.changePage(vm.currentPage + 1);
            }
            break;
        }
      }
    });

    window.addEventListener("resize", () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      const w = (100 * vw) / 1536;
      if (w > 100) {
        this.imageSize.width = w;
      }
      const h = (180 * vh) / 864;
      if (h > 130) {
        this.imageSize.height = h;
      }
    });
  },
  computed: {
    queueStatus() {
      return status => {
        switch (status) {
          case "active":
            return "green";
          case "pending":
            return "#F1C40F";
          case "posted":
            return "#424949 ";
          case "error":
            return "red";
          default:
            return "white";
        }
      };
    },
    codeIsDifferet() {
      if (this.code.currentCode === "" || this.code.oldCurrentCode === "") {
        return false;
      }
      return this.code.currentCode !== this.code.oldCurrentCode;
    }
  },
  methods: {
    clearGallery() {
      window.location = this.serviceUrl(`/instagram/site/gallery?username=${this.username}&homePage=0`);
    },
    changeUserApply() {
      const vm = this;
      if (this.modal.imageId && this.modal.currentUser) {
        axios
          .post(`/instagram/site/admin/users/changeuser/${this.modal.imageId}/${this.modal.currentUser}`)
          .then(response => {
            vm.processResponseMesage(response);
            vm.showModal = false;
            vm.changePage(vm.page);
          })
          .catch(e => console.log(e));
      } else {
        alert("invalid user or image");
      }
    },
    searchUser() {
      const vm = this;

      axios
        .get(`/instagram/site/admin/users/${this.modal.search}`)
        .then(response => {
          vm.modal.users = response.data ? response.data.map(u => u.username) : [];
        })
        .catch(e => console.log(e));
    },
    changeUser(imageId) {
      this.modal.imageId = imageId;
      this.showModal = true;
    },
    removeImageFromFeed(imageId) {
      let vm = this;
      const index = vm.feed.findIndex(i => i.id === imageId);
      vm.$delete(vm.feed, index);
    },
    cleanFeed() {
      this.showConfirm({
        title: "Confirm",
        message: "Clean Feed?",
        accept: _ => (this.feed = []),
        cancel: _ => {}
      });
    },
    uploadFeed() {
      let vm = this;
      if (this.feed.length > 0) {
        const removedThumbnail = this.feed.map(f => {
          delete f.thumbnail;
          return f;
        });
        axios
          .post(this.serviceUrl(`/instagram/api/feed/${this.username}`), removedThumbnail)
          .then(response => {
            vm.changePage(this.page);
            vm.feed = [];
            vm.isCreatingFeed = false;
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    mouseover(imageId, event) {
      if (!this.thumbnailIsActive) {
        this.thumbnailIsActive = true;
        const image = this.galleries.find(g => g.id == imageId);
        this.thumbnail = image.thumbnail;
        this.thumbnailPosition.top = event.clientY;
        this.thumbnailPosition.left = event.clientX;
        console.log("IN");
      }
    },
    mouseleave() {
      this.thumbnailIsActive = false;
      this.thumbnail = "";
    },
    addNewFeed(imageId) {
      console.log(imageId);
      const image = this.galleries.find(g => g.id == imageId);

      if (!this.feed.some(f => f.id === imageId)) {
        this.feed.push(image);
      }

      if (!this.isCreatingFeed) {
        this.isCreatingFeed = true;
      }
    },
    createFeed() {
      this.isCreatingFeed = !this.isCreatingFeed;
    },
    showPriorityQueue(galleryId) {
      if (typeof galleryId !== "string") {
        this.priorityQueue.feedId = vm.imageState.feedId;
      } else {
        this.priorityQueue.feedId = galleryId;
      }

      const now = new Date();
      this.priorityQueue.time = {
        hour: now.getHours(),
        minute: now.getMinutes(),
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getUTCFullYear()
      };

      this.priorityQueue.show = true;
    },
    onPriorityQueue() {
      const self = this;

      const offSet = new Date().getTimezoneOffset();

      axios
        .post(this.serviceUrl(`/instagram/api/queue/${self.priorityQueue.feedId}`), {
          caption: self.priorityQueue.caption,
          username: this.username,
          type: "priority",
          time: this.priorityQueue.time,
          offSet
        })
        .then(response => {
          self.priorityQueue.show = false;
          self.processResponseMesage(response);
          self.changePage(self.page);
        })
        .catch(e => console.log(e));
    },
    queue(galleryId) {
      let vm = this;

      if (typeof galleryId !== "string") {
        galleryId = vm.imageState.feedId;
      }

      const offSet = new Date().getTimezoneOffset();

      this.showConfirm({
        title: "Confirm",
        message: "Queue Feed?",
        accept: _ => {
          axios
            .post(this.serviceUrl(`/instagram/api/queue/${galleryId}`), {
              caption: "",
              username: this.username,
              type: "normal",
              time: this.priorityQueue.time,
              offSet
            })
            .then(response => {
              vm.processResponseMesage(response);
              vm.changePage(vm.page);
            })
            .catch(e => console.log(e));
        },
        cancel: _ => {}
      });
    },
    createpost(feedId) {
      let vm = this;

      if (typeof feedId !== "string") {
        feedId = vm.imageState.feedId;
      }

      const offSet = new Date().getTimezoneOffset();
      const self = this;

      this.showConfirm({
        title: "Confirm",
        message: "Post Image?",
        accept: _ => {
          axios
            .post(this.serviceUrl(`/instagram/api/queue/${feedId}`), {
              username: this.username,
              type: "inmediate",
              time: {
                hour: new Date().getHours(),
                minute: new Date().getMinutes(),
                day: new Date().getDate(),
                month: new Date().getMonth() + 1,
                year: new Date().getUTCFullYear()
              },
              offSet
            })
            .then(response => {
              self.processResponseMesage(response);
              self.changePage(self.page);
            })
            .catch(e => console.log(e));
        },
        cancel: _ => {}
      });
    },
    setsecureuser(secure) {
      let vm = this;
      axios
        .post(this.serviceUrl(`/instagram/site/admin/setsecure/${encodeURI(secure.username)}/${secure.status}`))
        .then(response => {
          vm.status = response.data.userstatus;
          vm.processResponseMesage(response);
        })
        .catch(e => console.log(e));
    },
    addTag() {
      let vm = this;
      const tag = prompt("New Tag");
      if (tag && tag.trim().length) {
        axios
          .post(this.serviceUrl(`/instagram/site/admin/tags`), {
            tags: [tag.trim().toLocaleLowerCase()]
          })
          .then(response => {
            console.log(response.data.tags);
            vm.tags = response.data.tags;
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    setTag(tag) {
      let vm = this;

      axios
        .post(this.serviceUrl(`/instagram/site/admin/tags/${this.imageState.feedId}/${tag}`))
        .then(response => {
          vm.imageState.tags = response.data.tags || [];
        })
        .catch(e => console.log(e));
    },
    isTaginUse(tag) {
      if (this.imageState && this.imageState.tags) {
        return this.imageState.tags.some(t => t === tag);
      }
    },
    showImage: function (feedId, node) {
      this.showDivImage = true;
      let imageId = "";

      if (typeof node === "string") {
        imageId = node;
      } else {
        imageId = node.imageId;
      }

      this.imageState = this.galleries.find(i => i.id === imageId);
      this.code.oldCurrentCode = this.code.currentCode;

      if (!feedId) {
        feedId = node.feedId;
      }

      axios
        .get(this.serviceUrl(`/instagram/site/admin/image/${feedId}/${imageId}`))
        .then(response => {
          this.image = response.data.image;
          this.imageState.tags = response.data.tags;
          this.imageState.code = response.data.code;
          this.code.currentCode = response.data.code;
        })
        .catch(e => console.log(e));
    },
    hideImage: function () {
      this.image = "";
      this.showDivImage = false;
      this.smallSize = true;
      this.code.currentCode = "";
      this.code.oldCurrentCode = "";
    },
    changePage: function (page) {
      let vm = this;
      let url = "";

      vm.page = page;

      if (page < 0) {
        vm.page = 0;
      }

      if (this.feedId) {
        url = this.serviceUrl(`/instagram/site/admin/gallery/${this.username}/${vm.page}/${this.feedId}`);
      } else {
        url = this.serviceUrl(`/instagram/site/admin/gallery/${this.username}/${vm.page}`);
      }

      axios
        .get(url)
        .then(response => {
          vm.galleries = response.data.galleries;
          vm.pages = response.data.pages;
          vm.currentPage = response.data.currentPage;
          console.log(response.data.queueStats);
          vm.queueStats = response.data.queueStats;
        })
        .catch(e => console.log(e));
    },
    deleteImage: function (imageId) {
      let vm = this;

      this.showConfirm({
        title: "Confirm",
        message: "Delete Image?",
        accept: _ => {
          axios
            .delete(this.serviceUrl(`/instagram/site/admin/image/${imageId}`))
            .then(response => {
              let index = vm.galleries.findIndex(i => i.id === imageId);
              vm.$delete(vm.galleries, index);
              vm.changePage(vm.page);
              vm.processResponseMesage(response);
            })
            .catch(e => {
              vm.processResponseMesage(e);
            });
        },
        cancel: _ => {}
      });
    },
    setthumbnail: function (imageId) {
      let vm = this;

      axios
        .post(this.serviceUrl(`/instagram/site/admin/setthumbnail/${imageId}`))
        .then(response => {
          vm.processResponseMesage(response);
        })
        .catch(e => {
          vm.processResponseMesage(e);
        });
    },
    resize: function () {
      this.smallSize = !this.smallSize;
    }
  }
});
