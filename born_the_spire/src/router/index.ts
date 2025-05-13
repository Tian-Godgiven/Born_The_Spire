import { createRouter, createWebHistory } from 'vue-router';
import Start from '@/page/Scene/start/Start.vue';
import Running from '@/page/Scene/running/Running.vue';

const routes = [
  {
    path: '/',
    name: 'start',
    component: Start
  },
  {
    path: '/running',
    name: 'running',
    component: Running
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
