import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueDragResize from 'vue-drag-resize'
import axios from 'axios'
// 将 axios 挂载到 Vue 原型上，这样在任何组件中都可以通过 this.$axios 访问
Vue.prototype.$axios = axios

Vue.component('vue-drag-resize', VueDragResize)
Vue.config.productionTip = false
Vue.use(ElementUI)

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
