var app = new Vue({
  el: "#login-app",
  mixins: [shared],
  data: {
    login: {
      username: "",
      password: "",
    },
  },
  created() {},
  mounted() {},
  computed: {},
  methods: {
    request() {
      const vm = this;
      axios
        .post(this.serviceUrl(`/instagram/site/admin/login`), this.login)
        .then(response => {
          localStorage.setItem("token", response.data.token);
          window.location.href = "home";
        })
        .catch(e => {
          vm.processResponseMesage(e.response);
        });
    },
  },
});
