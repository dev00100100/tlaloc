var app = new Vue({
  el: "#upload-manager",
  mixins: [shared],
  data: {
    selectedFiles: [],
    currentFile: undefined,
    progress: 0,
    message: "",
    fileInfos: [],
    username: ""
  },
  created() {},
  mounted() {
    this.reload();
  },
  computed: {
    fileSelected() {
      let files = "";
      if (this.selectedFiles.length > 0) {
        for (let file of this.selectedFiles) {
          files += `${file.name}, `;
        }

        return files;
      } else {
        return "Choose files";
      }
    }
  },
  methods: {
    selectFile() {
      this.selectedFiles = this.$refs.file.files;
    },
    uploadService(onUploadProgress) {
      let formData = new FormData();

      for (var i = 0; i < this.$refs.file.files.length; i++) {
        let file = this.$refs.file.files[i];
        formData.append("files[" + i + "]", file);
      }

      return axios.post(`/instagram/api/upload/${this.username}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress
      });
    },
    upload() {
      this.progress = 0;

      if (this.$refs.file.files.length > 0 && this.username) {
        this.uploadService(event => {
          this.progress = Math.round((100 * event.loaded) / event.total);
        })
          .then(response => {
            this.message = response.data.message;
            this.fileInfos = response.data.files;
          })
          .catch(() => {
            this.progress = 0;
            this.message = "Could not upload the file!";
            this.currentFile = undefined;
          });

        this.selectedFiles = undefined;
      } else {
        console.log("not user or files");
      }
    },
    reload() {}
  }
});
