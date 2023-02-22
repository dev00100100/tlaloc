var app = new Vue({
  el: "#user-manager",
  mixins: [shared],
  data: {
    users: [],
    showimage: false,
    page: 0,
    pages: 0,
    currentPage: 0,
    searchTerm: "",
    tagsBehaivor: {
      showSpan: true,
      showInput: false
    },
    thumbnail: "",
    searchFilter: {
      searchTerm: "",
      status: "",
      favorite: false,
      userfavorite: false,
      defaultSort: { favorite: -1, username: 1 },
      sort: { favorite: -1, username: 1 }
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
        return this.serviceUrl(`/instagram/site/gallery?username=${username}&homePage=0`);
      };
    },
    instagramLink() {
      return username => {
        return `https://www.instagram.com/${username}/`;
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
    sortBy(sortItem) {
      // let sort = {};
      // if (typeof this.searchFilter.sort[sortItem] !== "undefined") {
      //   this.searchFilter.sort[sortItem] = this.searchFilter.sort[sortItem] === 1 ? -1 : 1;
      // } else {
      //   sort[sortItem] = 1;
      // }
      // this.searchFilter.sort = sort;
      // console.log(this.searchFilter);
      // this.search();
    },
    setFavorite(username) {
      let vm = this;
      axios
        .post(this.serviceUrl(`/instagram/site/admin/setfavoriteuser/${username}`))
        .then(response => {
          let user = vm.users.find(g => g.username === username);
          user.favorite = !user.favorite;
          vm.processResponseMesage(response);
        })
        .catch(e => {
          vm.processResponseMesage(e);
        });
    },
    changeUserType(username) {
      let vm = this;
      let user = vm.users.find(g => g.username === username);
      const state = this.typeMatirx.find(t => t.key === user.status);

      axios
        .post(this.serviceUrl(`/instagram/site/admin/setsecure/${encodeURI(username)}/${state.newState}`))
        .then(response => {
          let user = vm.users.find(g => g.username === username);
          user.status = response.data.userstatus;
          vm.processResponseMesage(response);
        })
        .catch(e => console.log(e));
    },
    validateCharacteres($event) {
      return true;
      if (!/[a-zA-Z0-9\_\.\s]/.test($event.key)) {
        $event.preventDefault();
      }
    },
    editCaption(userId, state) {
      const user = this.users.find(u => u._id == userId);
      user.editting = state;

      this.$nextTick(() => {
        this.$refs[`caption_${userId}`][0].focus();
      });

      if (!state) {
        const caption = this.$refs[`caption_${userId}`][0].value;
        if (caption) {
          const vm = this;

          axios
            .post(this.serviceUrl(`/instagram/api/user/caption/${userId}`), {
              caption: user.caption
            })
            .then(response => {
              const u = vm.users.find(q => q._id === response.data.userId);
              u.caption = response.data.caption;
              vm.processResponseMesage(response);
            });
        }
      }
    },
    search(p) {
      const vm = this;

      if (p) {
        this.page = 0;
        // this.searchFilter.sort = this.searchFilter.defaultSort;
      }

      axios.post(this.serviceUrl(`/instagram/api/user/search/${this.page}`), this.searchFilter).then(response => {
        vm.users = response.data.users.map(u => {
          u.editting = false;
          return u;
        });
        vm.pages = parseInt(response.data.pages);
        vm.currentPage = parseInt(response.data.currentPage);
        vm.page = response.data.page;
      });
    },
    changePage(p) {
      let vm = this;
      this.page = p;
      this.currentPage = p;
      if (this.searchFilter.searchTerm || this.searchFilter.status || this.searchFilter.userfavorite) {
        this.search();
      } else {
        axios.get(this.serviceUrl(`/instagram/api/user/${this.page}`)).then(response => {
          vm.users = response.data.users.map(u => {
            u.editting = false;
            return u;
          });
          vm.pages = response.data.pages;
          vm.currentPage = response.data.currentPage;
          vm.searchFilter.searchTerm = "";
        });
      }
    },
    showImage(userId) {
      this.showimage = true;
      const vm = this;
      axios.get(this.serviceUrl(`/instagram/api/user/thumbnail/${userId}`)).then(response => {
        vm.thumbnail = response.data;
      });
    },
    hideimages() {
      this.showimage = false;
      this.thumbnail = "";
    },
    remove(userId) {
      let vm = this;
      this.showConfirm({
        title: "Confirm",
        message: "Delete user?",
        accept: _ => {
          axios
            .delete(this.serviceUrl(`/instagram/api/user/${userId}`))
            .then(response => {
              let index = vm.users.findIndex(i => i._id === userId);
              vm.$delete(vm.users, index);
              vm.processResponseMesage(response);
            })
            .catch(e => console.log(e));
        },
        cancel: _ => {}
      });
    },
    reload() {
      let vm = this;
      this.page = 0;
      axios.get(this.serviceUrl(`/instagram/api/user/${this.page}`)).then(response => {
        vm.users = response.data.users.map(u => {
          u.editting = false;
          return u;
        });
        vm.pages = response.data.pages;
        vm.currentPage = response.data.currentPage;
        vm.searchFilter.searchTerm = "";
        vm.searchFilter.status = "";
        vm.searchFilter.favorite = false;
      });
    }
  }
});
