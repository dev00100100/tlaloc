Vue.component("queue-metrics", {
  props: ["queuestats"],
  mixins: [shared],
  template: `
    <div>
        <div
        style="padding: 2px; padding-left: 5px; margin-right: 5px; margin-left: 5px"
        class="form-inline"
        >
        <div
            style="width: 20px; height: 20px; border-radius: 10px; font-size: 10px; color: white; padding: 2px"
            class="active text-center align-middle mt-1 ml-1"
        >
            {{queuestats.active.count}}
        </div>
        <div
            style="width: 20px; height: 20px; border-radius: 10px; font-size: 10px; color: black; padding: 2px"
            class="pending text-center align-middle mt-1 ml-2 mr-1"
        >
            {{queuestats.pending.count}}
         
        </div>
        <div
            style="width: 20px; height: 20px; border-radius: 10px; font-size: 10px; color: white; padding: 2px"
            class="posted text-center align-middle mt-1 ml-1 mr-1"
        >
            {{queuestats.posted.count}}
           
        </div>
        <div
            style="width: 20px; height: 20px; border-radius: 10px; font-size: 10px; color: white; padding: 2px"
            class="sh-error text-center align-middle mt-1 ml-1 mr-1"
        >
            {{queuestats.error.count}}
    
        </div>
    </div>
    </div>
        `,
  mounted() {},
  computed: {},
  data: function () {
    return {
      terminalMessages: [],
      windowsState: true,
      isTerminalLoading: false,
      lastTerminalLoaded: new Date()
    };
  },
  methods: {}
});
