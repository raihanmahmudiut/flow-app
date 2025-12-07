import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NodeDrawer from '../views/NodeDrawer.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    children: [
      {
        path: 'node/:id',
        name: 'node-details',
        component: NodeDrawer
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router