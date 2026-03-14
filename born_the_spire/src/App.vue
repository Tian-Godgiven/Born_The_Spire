<template>
  <main class="main" @mousemove="onMousemove">
    <div class="router">
      <RouterView></RouterView>
    </div>
    <!-- 动态组件容器 -->
    <DynamicComponentContainer />
    <!-- 确认弹窗 -->
    <ConfirmModal />
    <!-- 卡牌组弹窗 -->
    <CardGroupModal />
    <!-- 器官选择弹窗 -->
    <OrganChoice />
  </main>
</template>

<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';
import router from './ui/router';
import { onMousemove } from './ui/hooks/global/mousePosition';

// 使用异步组件避免在 preload 之前加载核心类
const DynamicComponentContainer = defineAsyncComponent(() =>
  import('./ui/components/global/DynamicComponentContainer.vue')
);
const ConfirmModal = defineAsyncComponent(() =>
  import('./ui/components/interaction/ConfirmModal.vue')
);
const CardGroupModal = defineAsyncComponent(() =>
  import('./ui/components/interaction/CardGroupModal.vue')
);
const OrganChoice = defineAsyncComponent(() =>
  import('./ui/components/interaction/OrganChoice.vue')
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
</style>