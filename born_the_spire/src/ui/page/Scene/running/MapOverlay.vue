<template>
  <div class="map-overlay" v-if="visible" @click.self="onClose">
    <div class="map-panel">
      <!-- 标题栏 -->
      <div class="map-header">
        <h2>地图</h2>
        <button class="close-btn" @click="onClose">✕</button>
      </div>

      <!-- 地图内容 -->
      <div class="map-content">
        <MapView @enter-room="onEnterRoom" />
      </div>

      <!-- 提示信息 -->
      <div class="map-footer">
        <p>点击可前往的节点以继续探索</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MapView from './MapView.vue'

const visible = ref(false)

// 显示地图
function show() {
  visible.value = true
}

// 隐藏地图
function hide() {
  visible.value = false
}

// 关闭地图（点击背景或关闭按钮）
function onClose() {
  hide()
}

// 进入房间时隐藏地图
function onEnterRoom() {
  hide()
}

// 暴露方法和状态给父组件
defineExpose({
  show,
  hide,
  visible
})
</script>

<style scoped lang="scss">
.map-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.map-panel {
  background: white;
  border: 2px solid #333;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #333;
  background: #f5f5f5;

  h2 {
    margin: 0;
    font-size: 24px;
  }
}

.close-btn {
  background: none;
  border: 2px solid #333;
  font-size: 24px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.map-content {
  flex: 1;
  overflow: hidden;
}

.map-footer {
  padding: 15px 20px;
  border-top: 2px solid #333;
  background: #f5f5f5;
  text-align: center;

  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}
</style>
