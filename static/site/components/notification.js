Vue.component("notification", {
  props: ["alerts"],
  template: `
    <div class="container fixed-top">
      <div class="row">          
          <div class="alert alert-success col-12" role="alert" v-show="alerts.success.show" style="z-index: 9999">
              {{alerts.success.message}}
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
          </div>
          <div class="alert alert-danger col-12" role="alert" v-show="alerts.error.show" style="z-index: 9999">
              {{alerts.error.message}}
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
          </div>
      </div>  
    </div>  
    `,
  data() {
    return {};
  }
});
