<template>
  <main class="main" @mousemove="onMousemove">
    <div class="router">
      <RouterView></RouterView>
    </div>
    <!-- 弹窗容器 -->
    <PopUpContainer />
    <!-- 动态组件容器 -->
    <DynamicComponentContainer />
    <!-- 确认弹窗 -->
    <ConfirmModal />
    <!-- 器官选择弹窗 -->
    <OrganChoice />
    <!-- 开发者控制台 -->
    <DevConsole />
  </main>
</template>

<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';
import router from './ui/router';
import { onMousemove } from './ui/hooks/global/mousePosition';

// 使用异步组件避免在 preload 之前加载核心类
const PopUpContainer = defineAsyncComponent(() =>
  import('./ui/components/global/PopUpContainer.vue')
);
const DynamicComponentContainer = defineAsyncComponent(() =>
  import('./ui/components/global/DynamicComponentContainer.vue')
);
const ConfirmModal = defineAsyncComponent(() =>
  import('./ui/components/interaction/ConfirmModal.vue')
);
const OrganChoice = defineAsyncComponent(() =>
  import('./ui/components/interaction/OrganChoice.vue')
);
const DevConsole = defineAsyncComponent(() =>
  import('./ui/page/tool/console/DevConsole.vue')
);

onMounted(()=>{
    router.replace("/")
})
</script>

<style lang="scss">
body{
  margin: 0;
}
.main{
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 全局滚动条样式 */
* {
  /* Webkit 浏览器（Chrome, Safari, Edge） */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}
</style>