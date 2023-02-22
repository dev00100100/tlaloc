var app = new Vue({
  el: "#app-main-gallery",
  mixins: [shared],
  data: {
    username: "",
    galleries: [],
    imageId: "",
    pages: 0,
    currentPage: 0,
    query: "",
    page: 0
  },
  mounted() {
    let uri = window.location.search.substring(1);
    let params = new URLSearchParams(uri);
    this.homePage = params.get("homePage");

    if (!this.homePage) {
      this.homePage = 0;
    }

    this.page = this.homePage;
    let query = localStorage.getItem("query");

    if (query) {
      this.query = query;
      this.search();
    } else {
      axios.get(this.serviceUrl(`/instagram/site/admin/galleries/${this.homePage}`)).then(response => {
        this.galleries = response.data.galleries;
        this.pages = response.data.pages;
        this.currentPage = response.data.currentPage;
        this.page = this.homePage;
        console.log(`page ${this.page} currentpage ${this.currentPage}`);
      });
    }
  },
  computed: {
    galleryLink() {
      return gallery => `gallery?username=${encodeURI(gallery.username)}&homePage=${this.currentPage}`;
    },
    instagramLink() {
      return username => `https://www.instagram.com/${username}`;
    }
  },
  methods: {
    setSecure(username) {
      let vm = this;
      let user = vm.galleries.find(g => g.username === username);
      const state = this.typeMatirx.find(t => t.key === user.status);

      axios
        .post(this.serviceUrl(`/instagram/site/admin/setsecure/${encodeURI(username)}/${state.newState}`))
        .then(response => {
          let user = vm.galleries.find(g => g.username === username);
          user.status = response.data.userstatus;
          vm.processResponseMesage(response);
        })
        .catch(e => console.log(e));
    },
    clearSearch: function () {
      this.query = "";
      this.page = 0;
      this.homePage = 0;
      localStorage.setItem("query", this.query);
      window.location = `home`;
    },
    searchKey: function (e) {
      if (e && e.keyCode === 13) {
        this.search(0);
      }
    },
    search: function (page) {
      let vm = this;

      if (typeof page !== "undefined") {
        this.page = page;
      }

      if (vm.page < 0 || !vm.page) {
        vm.page = 0;
      }

      if (vm.query) {
        localStorage.setItem("query", vm.query);
        axios
          .post(this.serviceUrl(`/instagram/site/admin/galleries/${vm.page}/${encodeURI(vm.query)}`))
          .then(response => {
            vm.galleries = response.data.galleries;
            vm.pages = response.data.pages;
            vm.currentPage = response.data.currentPage;
          })
          .catch(e => console.log(e));
      } else {
        this.changePage(0);
      }
    },
    changePage: function (page) {
      let vm = this;
      vm.page = page;

      if (page < 0) {
        vm.page = 0;
      }
      if (!vm.query) {
        axios
          .get(this.serviceUrl(`/instagram/site/admin/galleries/${vm.page}`))
          .then(response => {
            vm.galleries = response.data.galleries;
            vm.pages = response.data.pages;
            vm.currentPage = response.data.currentPage;
          })
          .catch(e => console.log(e));
      } else {
        vm.search();
      }
    },
    deleteUser: function (userId) {
      let vm = this;

      this.showConfirm({
        title: "Confirm",
        message: "Clean Feed?",
        accept: _ => {
          axios
            .delete(this.serviceUrl(`/instagram/api/user/${userId}`))
            .then(response => {
              let index = vm.galleries.findIndex(i => i.id === userId);
              vm.$delete(vm.galleries, index);
              vm.processResponseMesage(response);
            })
            .catch(e => console.log(e));
        },
        cancel: _ => {}
      });
    },
    setfavorite: function (username) {
      let vm = this;
      axios
        .post(this.serviceUrl(`/instagram/site/admin/setfavoriteuser/${username}`))
        .then(response => {
          let user = vm.galleries.find(g => g.username === username);
          user.favorite = !user.favorite;
          vm.processResponseMesage(response);
        })
        .catch(e => {
          vm.processResponseMesage(e);
        });
    }
  }
});
