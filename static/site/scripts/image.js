var app = new Vue({
  el: "#images",
  data: {
    size: 16,
    imageSize: {
      width: 120,
      height: 200
    }
  },
  mounted() {
    window.addEventListener("resize", () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      this.imageSize.width = (100 * vw) / 1536;
      this.imageSize.height = (180 * vh) / 864;
    });
  },
  computed: {},
  methods: {
    changePage(p) {
      console.log(p);
    }
  }
});

// let nodes = [
// 	{ id: 1, p: null, n: null},
//   { id: 2, p: null, n: null},
//   { id: 3, p: null, n: null},
//   { id: 4, p: null, n: null},
//   { id: 5, p: null, n: null},
//   { id: 6, p: null, n: null},
//   { id: 7, p: null, n: null},
//   { id: 8, p: null, n: null},
//   { id: 9, p: null, n: null},
//   { id: 10, p: null, n: null},
// ];

// let tempNode = null;
// for(let node of nodes) {
// 	if(!tempNode) {
//   	node.p = null;
//   } else {
//   	node.p = tempNode.id
//     tempNode.n = node.id
//   }

// 	tempNode = node;
// }

// console.log(nodes)
