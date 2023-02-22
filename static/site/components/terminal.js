Vue.component("terminal", {
  props: ["viewterminal"],
  mixins: [shared],
  template: `
  <div>
        <a href="#" class="btn btn-dark btn-sm" @click="maximize" v-show="!windowsState" style="position: fixed; top: 5px;left: 50px; z-index: 1000">
            <i class="fas fa-window-maximize"></i>
        </a>
        <div class="terminal" v-show="showterminal && windowsState" >          
            <div style="width: 100%; height: 15px;"" >
                <div style="color: white; width: 80%; float: left; padding-left:5px; padding-top: 3px; padding-bottom;3px" >
                    Terminal        
                </div>
                <div style="color: white; width: 20%; float: left; text-align: right; padding-right:5px; padding-top: 3px; padding-bottom;3px">
                    <a href="#" class="badge badge-dark" @click="cls"> <i class="fas fa-eraser"></i></a>
                    <a href="#" class="badge badge-dark" @click="minimize"> <i class="fas fa-window-minimize"></i></a>                              
                    <a href="#" class="badge badge-dark" @click="hideterminal"><i class="fas fa-times"></i></a>      
                </div>
            </div>
            <div id="terminal-canvas" style="width: 100%; overflow-y: scroll; max-height: 60vh; max-width: 60vw; height: calc(60vh - 30px)">
                <ul style="list-style: none; padding-left: 5px;">
                    <li v-for="m in terminalMessages" style="font-size: 11px">
                        <span style="color: white">[{{m.date}}]</span>
                        <span style="color: yellow"> server@instagram.com </span> 
                        <span style="color: orange">[{{m.component}}]</span>
                        <span style="color: white">&gt;</span>
                        <span style="color: white" v-html="m.message"></span>
                    </li>
                </ul>  
            </div>
        </div>
    </div>
      `,
  mounted() {
    let vm = this;

    setInterval(_ => {
      this.loadTerminalEvents(vm.scroll);
    }, 5000);

    setInterval(_ => {
      const current = new Date();
      var diff = current.getTime() - this.lastTerminalLoaded.getTime();
      const minutesSinceLastLoaded = diff / 60000;
      if (minutesSinceLastLoaded > 1) {
        this.isTerminalLoading = false;
      }
    }, 60000);

    this.loadTerminalEvents(vm.scroll);
  },
  computed: {
    showterminal: {
      get: function () {
        this.scroll();
        return this.viewterminal;
      },
      set: function (value) {
        this.scroll();
        this.viewterminal = value;
      }
    }
  },
  data: function () {
    return {
      terminalMessages: [],
      windowsState: true,
      isTerminalLoading: false,
      lastTerminalLoaded: new Date()
    };
  },
  methods: {
    loadTerminalEvents(callback) {
      const self = this;
      if (!this.isTerminalLoading && this.showterminal) {
        axios.get(this.serviceUrl(`/instagram/api/terminal`)).then(response => {
          self.terminalMessages = response.data.events;
          self.isTerminalLoading = false;
          self.lastTerminalLoaded = new Date();
          self.processResponseMesage(response);
          callback();
        });
        this.isTerminalLoading = true;
      }
    },
    scroll() {
      if (this.$el) {
        let terminal = this.$el.querySelector("#terminal-canvas");
        terminal.scrollTop = terminal.scrollHeight;
      }
    },
    cls() {
      this.terminalMessages = "";
      axios.delete(this.serviceUrl(`/instagram/api/terminal`)).then(response => {
        self.terminalMessages = [];
        self.isTerminalLoading = false;
        self.lastTerminalLoaded = new Date();
      });
    },
    minimize() {
      this.windowsState = false;
    },
    maximize() {
      this.windowsState = true;
    },
    hideterminal() {
      this.$emit("hideterminal", false);
    }
  }
});
