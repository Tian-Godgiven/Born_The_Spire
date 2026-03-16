import { createRouter, createWebHistory } from 'vue-router';

// 使用懒加载避免在 preload 之前加载组件
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/ui/page/Scene/start/Start.vue')
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('@/ui/page/Scene/start/Setup/index.vue')
  },
  {
    path: '/running',
    name: 'running',
    component: () => import('@/ui/page/Scene/running/Running.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
