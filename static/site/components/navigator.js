Vue.component("navigator", {
  props: [],
  template: `
    <div class="topcorner" style="z-index: 1000">
        <div class="btn-group  btn-group">
            <button type="button" class="btn btn-light fas fa-bars" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>
            <div class="dropdown-menu" >  
                <div class="dropdown-item link" @click="navigate('home')">                   
                     <a href="home" ><i class="fas fa-igloo"></i>&nbsp;home</a>
                </div>
                <div class="dropdown-item link"  @click="navigate('queue')">                    
                    <a href="queue"><i class="fas fa-layer-group"></i>&nbsp;queue</a>
                </div> 
                <div class="dropdown-item link" @click="navigate('feeds')">                 
                    <a href="feeds"><i class="fas fa-rss"></i>&nbsp;feeds</a>
                </div> 
                <div class="dropdown-item link" @click="navigate('upload')">                    
                    <a href="upload"><i class="fas fa-cloud-upload-alt"></i>&nbsp;upload</a>
                </div> 
                <div class="dropdown-item link"  @click="navigate('users')">                  
                    <a href="users"><i class="fas fa-user"></i>&nbsp;users</a>
                </div>   
                <div class="dropdown-item link"  @click="navigate('configuration')">                
                    <a href="configuration" ><i class="fas fa-cogs"></i>&nbsp;configuration</a>
                </div>         
                <div class="dropdown-divider"></div>
                <div class="dropdown-item link" v-on:click="viewTerminal">                
                      <i class="fas fa-terminal"></i>&nbsp;Terminal
                </div>           
                <div class="dropdown-item link" v-on:click="processQueue">                    
                      <i class="fas fa-layer-group"></i>&nbsp;Process Queue
                </div>        
                <div class="dropdown-item link" v-on:click="queueRandom">                   
                      <i class="fas fa-random"></i>&nbsp;Queue Random
                </div>              
                <div class="dropdown-item link" v-on:click="downloadPost">             
                      <i class="fas fa-cloud-download-alt"></i>&nbsp;Download
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item link" v-on:click="logout">                    
                    <i class="fas fa-sign-out-alt"></i>&nbsp;Logout
                </div>
            </div>
        </div>
    </div> 
      `,
  data() {
    return {};
  },
  methods: {
    navigate(page) {
      window.location = page;
    },
    viewTerminal() {
      console.log("view terminal");
      return this.$emit("viewterminal", true);
    },
    postRandom() {
      this.$emit("postrandom", {});
    },
    downloadPost() {
      this.$emit("download", {});
    },
    processQueue() {
      this.$emit("processqueue", {});
    },
    queueRandom() {
      this.$emit("queuerandom", {});
    },
    logout() {
      localStorage.removeItem("token");
      window.location.href = "login";
    }
  }
});
