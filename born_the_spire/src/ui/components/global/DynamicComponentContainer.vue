<template>
  <Teleport to="body">
    <!-- 全屏模式 -->
    <div
      v-if="componentManager.state.isVisible && componentManager.state.layout === 'fullscreen'"
      class="component-container fullscreen"
    >
      <component
        :is="componentManager.state.component"
        v-bind="componentManager.state.data"
        @complete="handleComplete"
        @cancel="handleCancel"
      />
    </div>

    <!-- 弹窗模式 -->
    <div
      v-if="componentManager.state.isVisible && componentManager.state.layout === 'modal'"
      class="component-container modal"
    >
      <div class="modal-overlay" @click="handleOverlayClick"></div>
      <div class="modal-content">
        <component
          :is="componentManager.state.component"
          v-bind="componentManager.state.data"
          @complete="handleComplete"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <!-- 内联模式（由父组件控制位置） -->
    <div
      v-if="componentManager.state.isVisible && componentManager.state.layout === 'inline'"
      class="component-container inline"
    >
      <component
        :is="componentManager.state.component"
        v-bind="componentManager.state.data"
        @complete="handleComplete"
        @cancel="handleCancel"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { componentManager } from '@/core/hooks/componentManager'

/**
 * 处理组件完成
 */
function handleComplete(result?: any) {
  componentManager.closeComponent(result)
}

/**
 * 处理组件取消
 */
function handleCancel(reason?: any) {
  componentManager.cancelComponent(reason)
}

/**
 * 处理遮罩点击（弹窗模式）
 */
function handleOverlayClick() {
  // 可选：点击遮罩关闭弹窗
  // componentManager.cancelComponent('overlay-click')
}
</script>

<style scoped lang="scss">
.component-container {
  position: fixed;
  z-index: 9999;

  &.fullscreen {
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white;
  }

  &.modal {
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;

    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
      position: relative;
      z-index: 1;
      background: white;
      border: 2px solid black;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
    }
  }

  &.inline {
    position: relative;
    z-index: auto;
  }
}
</style>
