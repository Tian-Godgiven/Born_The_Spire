<template>
  <main class="main" @mousemove="onMousemove">
    <div v-if="needsLandscapePrompt" class="landscape-prompt">
      请横屏游玩
    </div>
    <div class="router">
      <RouterView></RouterView>
    </div>
    <!-- 弹窗容器 -->
    <PopUpContainer />
    <!-- 动态组件容器 -->
    <DynamicComponentContainer />
    <!-- 吞噬确认弹窗 -->
    <DevourConfirmModal />
    <!-- 器官选择弹窗 -->
    <OrganChoice />
    <!-- 战斗失败弹窗 -->
    <BattleDefeatModal />
    <!-- 开发者控制台 -->
    <DevConsole />
  </main>
</template>

<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';
import router from './ui/router';
import { onMousemove } from './ui/hooks/global/mousePosition';
import { initLayoutMode, needsLandscapePrompt } from './ui/hooks/global/layoutMode';
import './ui/styles/layout/pc.scss';
import './ui/styles/layout/mobile.scss';

initLayoutMode()

// 使用异步组件避免在 preload 之前加载核心类
const PopUpContainer = defineAsyncComponent(() =>
  import('./ui/components/global/PopUpContainer.vue')
);
const DynamicComponentContainer = defineAsyncComponent(() =>
  import('./ui/components/global/DynamicComponentContainer.vue')
);
const DevourConfirmModal = defineAsyncComponent(() =>
  import('./ui/components/interaction/DevourConfirmModal.vue')
);
const OrganChoice = defineAsyncComponent(() =>
  import('./ui/components/interaction/OrganChoice.vue')
);
const BattleDefeatModal = defineAsyncComponent(() =>
  import('./ui/components/interaction/BattleDefeatModal.vue')
);
const DevConsole = defineAsyncComponent(() =>
  import('./ui/page/tool/console/DevConsole.vue')
);

onMounted(()=>{
    router.replace("/")
})
</script>

<style lang="scss">
@use './ui/styles/variables' as *;

:root {
  --popover-hover-open-delay: #{$popover-hover-open-delay};
}

body{
  margin: 0;
}
.main{
  padding: var(--layout-page-padding);
  padding-top: calc(var(--layout-page-padding) + var(--layout-safe-top));
  padding-right: calc(var(--layout-page-padding) + var(--layout-safe-right));
  padding-bottom: calc(var(--layout-page-padding) + var(--layout-safe-bottom));
  padding-left: calc(var(--layout-page-padding) + var(--layout-safe-left));
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
.landscape-prompt{
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #000;
  font-size: 24px;
  border: 2px solid #000;
}
.router{
  width: 100%;
  height: 100%;
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