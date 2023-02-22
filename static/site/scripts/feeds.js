var app = new Vue({
  el: "#queue-manager",
  mixins: [shared],
  data: {
    feeds: [],
    showimage: false,
    images: [],
    page: 0,
    pages: 0,
    currentPage: 0,
    searchTerm: ''
  },
  created() {
    document.onkeydown = evt => {
      evt = evt || window.event;
      if (evt.keyCode == 27 && this.showimage) {
        this.hideimages()
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
      }
    }
  },
  methods: {
    post(feedId) {
      if (confirm('Post?')) {
        const vm = this;
        axios.post(this.serviceUrl(`/instagram/api/feed/post/${feedId}`)).then(response => {
          vm.processResponseMesage(response);
        }).catch(e => console.log(e));
      }
    },
    queue(feedId) {
      const vm = this;

      if (confirm('Queue?')) {
        const feed = this.feeds.find(f => f.id === feedId);
        axios.post(this.serviceUrl(`/instagram/api/feed/queue/${feed.id}`)).then(response => {
          vm.processResponseMesage(response);
        }).catch(e => console.log(e));
      }
    },
    emptyFeeds() {
      this.search({
        searchForEmpty: true,
        page: 0
      });
    },
    search(params) {
      const vm = this;
      let url = '';

      if (params && params.searchForEmpty) {
        this.page = 0;
        url = this.serviceUrl(`/instagram/api/feeds/search/empty/${params.page}/true`);
      } else {
        url = this.serviceUrl(`/instagram/api/feeds/search/${params.page}/${encodeURI(this.searchTerm)}`);
      }

      if (this.searchTerm || params.searchForEmpty) {
        axios.get(url).then(response => {
          vm.feeds = response.data.feeds;
          vm.pages = parseInt(response.data.pages);
          vm.currentPage = parseInt(response.data.currentPage);
          vm.page = response.data.page;
        });
      }
    },
    changePage(p) {
      let vm = this;
      this.page = p;
      this.currentPage = p;

      if (this.searchTerm) {
        this.search({
          page: this.page
        });
      } else {
        axios.get(this.serviceUrl(`/instagram/api/feeds/${this.page}`)).then(response => {
          vm.feeds = response.data.feeds;
          vm.pages = response.data.pages;
          vm.currentPage = response.data.currentPage;
        });
      }
    },
    showimages(feedId) {
      this.showimage = true;
      const vm = this;
      axios.get(this.serviceUrl(`/instagram/site/admin/thumnails/${feedId}`)).then(response => {      
        console.log(response.data);
        vm.images = response.data;
      });          
    },
    hideimages() {
      this.showimage = false;
      this.images = [];
    },
    remove(feedId) {
      let vm = this;
      if (confirm('Delete?')) {
        axios.delete(this.serviceUrl(`/instagram/api/feeds/${feedId}`)).then(response => {
          let index = vm.feeds.findIndex(i => i.id === feedId);
          vm.$delete(vm.feeds, index);
          vm.processResponseMesage(response);
        }).catch(e => console.log(e));
      }
    },
    reload(isClear) {
      let vm = this;
      if (this.searchTerm && !isClear) {
        this.search({
          page: 0
        });
      } else {
        this.page = 0;
        this.currentPage = 0;
        axios.get(this.serviceUrl(`/instagram/api/feeds/${this.page}`)).then(response => {
          vm.feeds = response.data.feeds;
          vm.pages = response.data.pages;
          vm.currentPage = response.data.currentPage;
          vm.searchTerm = '';
        });
      }
    }
  },
});