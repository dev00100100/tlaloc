Vue.component("paginator", {
  props: ["initpage", "initpages", "initcurrentpage", "showhomebutton", "inithomepage", "username", "showsecurebutton", "issecure", "usekeypress"],
  template: `<div>
        <div class="container">
            <div class="row">
                <div class="col-4 text-right"><h5 class="mt-3" v-if="username"><a :href="usernameLink" target="_blank">{{username}}</a></h5></div>
                <div class="col-5 text-left">
                    <div class="text-center mt-2 mb-2">
                        <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <a v-if="showhomebutton" class="btn btn-outline-secondary btn-sm" :href="homepage" role="button">home</a>
                                <button type="button" class="btn btn-outline-secondary btn-sm" v-on:click="changePage(0, false)"><<</button>
                                <button type="button" class="btn btn-outline-secondary btn-sm" v-on:click="changePage(currentPage - 1, false)"><</button> 
                            </div>
                            <select class="custom-select" v-model="page" style="width: 60px;" v-on:change="changePage($event.target.value)">                                
                                <option :value="p - 1" v-for="p in pages">Page {{p}}</option>                            
                            </select>
                            <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
                                <label class="input-group-text">{{pages}}</label>
                                <button type="button" class="btn btn-outline-secondary btn-sm" v-on:click="changePage(currentPage + 1, true)">></button>
                                <button type="button" class="btn btn-outline-secondary btn-sm" v-on:click="changePage(pages - 1), true">>></button>
                                <div class="btn-group" role="group"  v-if="showsecurebutton" >
                                        <button id="btnGroupDrop1" 
                                        :class="{ 
                                        'btn-outline-secondary fa-bars': isSecureUser === 'unknown',                                                                              
                                        'btn-success fa-check': isSecureUser === 'secure',
                                        'fa-times btn-danger': isSecureUser === 'notsecure',
                                        'fa-share-alt btn-danger': isSecureUser === 'sharer' }" 
                                        type="button" class="btn  btn-sm fas" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">      
                                        </button>
                                        <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                                        <a v-on:click="setecureuser('secure')" class="dropdown-item" href="#"><i class="fas fa-check btn-sm"></i>&nbsp;Secure</a>
                                        <a v-on:click="setecureuser('notsecure')" class="dropdown-item" href="#"><i class="fas fa-times btn-sm"></i>&nbsp;No Secure</a>
                                        <a v-on:click="setecureuser('sharer')" class="dropdown-item" href="#"><i class="fas fa-share-alt btn-sm"></i>&nbsp;Sharer</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                    </div>
                </div>                                               
            </div>
        </div>
    </div>`,
  mounted: function () {
    const vm = this;

    if (typeof this.usekeypress !== "undefined") {
      if (this.usekeypress) {
        window.addEventListener("keypress", function (e) {
          switch (e.keyCode) {
            case 97: //a
              vm.changePage(vm.currentPage - 1, false);
              break;
            case 100: //d
              vm.changePage(vm.currentPage + 1, true);
              break;
          }
        });
      }
    }
  },
  computed: {
    page: {
      get: function () {
        return this.initpage;
      },
      set: function (value) {
        console.log(value);
      }
    },
    currentPage: function () {
      return parseInt(this.initcurrentpage);
    },
    pages: function () {
      return this.initpages;
    },
    homepage: function () {
      return `home?homePage=${this.inithomepage}`;
    },
    usernameLink: function () {
      return `https://www.instagram.com/${this.username}`;
    },
    isSecureUser: function () {
      return this.issecure;
    }
  },
  data: function () {
    return {};
  },
  methods: {
    changePage: function (p, direction) {
      if (p < this.pages && direction) {
        this.$emit("changepage", p);
      } else if (p >= 0 && !direction) {
        this.$emit("changepage", p);
      }
    },
    setecureuser(status) {
      this.$emit("setsecureuser", { username: this.username, status: status });
    }
  }
});
