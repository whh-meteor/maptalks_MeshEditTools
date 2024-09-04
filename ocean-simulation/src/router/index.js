import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Map',
    component: () => import(/* webpackChunkName: "map" */ '../views/Map.vue')
  },
  {
    path: '/2dMaps',
    name: 'Map2',
    component: () => import(/* webpackChunkName: "map" */ '../views/2dMaps.vue')
  },
  {
    path: '/particle',
    name: 'Map3',
    component: () =>
      import(
        /* webpackChunkName: "map" */ '../components/Particle/threeParticle.vue'
      )
  }
]

const router = new VueRouter({
  routes
})

export default router
