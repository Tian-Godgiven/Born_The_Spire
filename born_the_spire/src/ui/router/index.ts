import { createRouter, createWebHashHistory } from 'vue-router';

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
  // 分享和刷新不依赖服务器把 /setup、/running 回退到 index.html。
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
