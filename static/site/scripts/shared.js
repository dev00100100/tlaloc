var shared = {
  data: function () {
    return {
      confirm: {
        title: "",
        message: "",
        show: false,
        accept: "",
        cancel: ""
      },
      baseUrl: "127.0.0.1:3000",
      isLoading: false,
      displayterminal: false,
      alerts: {
        success: {
          message: "",
          show: false
        },
        error: {
          message: "",
          show: false
        }
      },
      typeMatirx: [
        { key: "secure", newState: "notsecure" },
        { key: "notsecure", newState: "sharer" },
        { key: "sharer", newState: "secure" },
        { key: "unknown", newState: "secure" }
      ],
      ignoreUrlLoadingScreen: ["/instagram/api/terminal"]
    };
  },
  computed: {},
  mounted() {
    let vm = this;
    axios.interceptors.request.use(
      function (config) {
        if (vm.ignoreUrlLoadingScreen.some(u => config.url.indexOf(u) < 0)) {
          vm.isLoading = true;
        }
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = token;
        }
        return config;
      },
      function (error) {
        console.log("Error");
        vm.isLoading = false;
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      function (response) {
        if (vm.ignoreUrlLoadingScreen.some(u => response.config.url.indexOf(u) < 0)) {
          setTimeout(function () {
            vm.isLoading = false;
          }, 100);
        }

        return response;
      },
      function (error) {
        vm.isLoading = false;

        if (error.response) {
          if (error.response.status === 401 && error.response.config.url.indexOf("/login") === -1) {
            window.location.href = "login";
          }
        } else {
          console.log(error);
        }

        return Promise.reject(error);
      }
    );
  },
  methods: {
    serviceUrl(url) {
      const completedUrl = `https://${this.baseUrl}${url}`;
      return completedUrl;
    },
    showConfirm(params) {
      this.confirm.title = params.title;
      this.confirm.message = params.message;
      this.confirm.accept = params.accept;
      this.confirm.cancel = params.cancel;

      this.confirm.show = true;
    },
    accept(params) {
      this.confirm.show = params.show;
      this.confirm.accept(params);
    },
    cancel(params) {
      this.confirm.show = params.show;
      this.confirm.cancel(params);
    },
    hideTerminal() {
      this.displayterminal = false;
    },
    showTerminal(view) {
      this.displayterminal = view;
    },
    queueRandom() {
      let vm = this;
      if (confirm("queue random?")) {
        axios
          .post(this.serviceUrl(`/instagram/api/postrandom/`))
          .then(response => {
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    postRandom() {
      let vm = this;
      if (confirm("post random?")) {
        axios
          .post(this.serviceUrl(`/instagram/api/postrandom`))
          .then(response => {
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    downloadPost() {
      let vm = this;
      axios
        .post(this.serviceUrl(`/instagram/api/getSavedItems`))
        .then(response => {
          vm.processResponseMesage(response);
        })
        .catch(e => console.log(e));
    },
    processQueue() {
      let vm = this;
      if (confirm("process queue?")) {
        axios
          .post(this.serviceUrl(`/instagram/api/processQueue`))
          .then(response => {
            vm.processResponseMesage(response);
          })
          .catch(e => console.log(e));
      }
    },
    processResponseMesage: function (response) {
      let vm = this;
      if (response && response.data && response.data.status === "done") {
        vm.alerts.success.show = true;
        vm.alerts.success.message = `${response.data.message}`;
        setTimeout(() => {
          vm.alerts.success.show = false;
          vm.alerts.success.message = "";
        }, 3000);
      } else {
        if (response && response.data && response.data.message) {
          vm.alerts.error.show = true;
          vm.alerts.error.message = `${response.data.message}`;
          setTimeout(() => {
            vm.alerts.error.show = false;
            vm.alerts.error.message = "";
          }, 10000);
        } else {
          vm.alerts.error.show = true;
          vm.alerts.error.message = response.message;
          setTimeout(() => {
            vm.alerts.error.show = false;
            vm.alerts.error.message = "";
          }, 10000);
        }
      }
    }
  }
};
