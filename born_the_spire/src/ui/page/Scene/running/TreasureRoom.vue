<template>
  <div class="treasure-room">
    <div class="treasure-container">
      <h2>宝箱房间</h2>
      <div class="treasure-content">
        <div class="chest-placeholder">
          <div class="chest-icon">📦</div>
          <p class="todo-notice">⚠️ 此房间类型尚未实现</p>
          <p class="todo-description">
            未来将实现：<br>
            - 宝箱打开动画<br>
            - 遗物奖励选择<br>
            - 不同类型的宝箱
          </p>
        </div>
      </div>

      <!-- 临时：直接离开按钮 -->
      <div class="actions">
        <button class="leave-btn" @click="leaveRoom">
          离开房间
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { completeAndGoNext } from '@/core/hooks/step'

async function leaveRoom() {
  await completeAndGoNext()
}
</script>

<style scoped lang="scss">
.treasure-room {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.treasure-container {
  max-width: 600px;
  padding: 40px;
  background: white;
  border: 2px solid #333;
  text-align: center;
}

h2 {
  margin: 0 0 30px 0;
  font-size: 28px;
}

.treasure-content {
  margin-bottom: 30px;
}

.chest-placeholder {
  padding: 40px;
  border: 2px dashed #ccc;
  background: #fafafa;
}

.chest-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.todo-notice {
  font-size: 18px;
  color: #ff9800;
  margin: 10px 0;
  font-weight: bold;
}

.todo-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 15px 0 0 0;
}

.actions {
  display: flex;
  justify-content: center;
}

.leave-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid #333;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
