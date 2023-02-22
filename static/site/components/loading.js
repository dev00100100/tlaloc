Vue.component("loading", {
    props: ["loading"],
    template: `
    <div class="loading fixed-top" v-show="loading">
        <div class="d-flex justify-content-center">
            <div class="spinner-grow  text-light spinner" style="width: 3rem; height: 3rem;" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    </div>
      `,
    data() {
        return {};
    },
    methods: {
    }
});
