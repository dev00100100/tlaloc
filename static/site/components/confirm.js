Vue.component("confirm", {
  props: ["title", "message", "showconfirm"],
  template: `
        <div v-if="show">
            <transition name="modal">
                <div class="modal-mask">
                    <div class="modal-wrapper">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">{{title}}</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true" @click="cancel">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    {{message}}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary btn-sm"
                                        @click="cancel">Close</button>
                                    <button type="button" class="btn btn-outline-secondary btn-sm"
                                        @click="accept">Accept</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
      `,
  data() {
    return {};
  },
  mounted() {},
  computed: {
    show() {
      return this.showconfirm;
    }
  },
  methods: {
    accept() {
      this.$emit("accept", { show: false });
    },
    cancel() {
      this.$emit("cancel", { show: false });
    }
  }
});
