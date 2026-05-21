<template>
  <div class="confirm-overlay" v-if="visible">
    <div class="confirm-modal">
      <div class="confirm-title">{{ title }}</div>

      <div class="confirm-content">
        <div class="confirm-message">{{ message }}</div>

        <!-- 显示将被吞噬的器官信息 -->
        <div v-if="organ" class="devour-info">
          <div class="devour-label">将被吞噬的器官：</div>
          <div class="organ-card">
            <div class="organ-name">{{ organ.label }}</div>
            <div class="organ-gain">获得物质：+{{ material }}</div>
          </div>
        </div>
      </div>

      <div class="confirm-actions">
        <button class="action-btn" @click="handleCancel">取消</button>
        <button class="action-btn primary" @click="handleConfirm">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  showConfirmModal,
  confirmTitle,
  confirmMessage,
  confirmOrgan,
  confirmMaterial,
  confirmAction,
  cancelAction
} from '@/ui/hooks/interaction/confirmModal'

const visible = computed(() => showConfirmModal.value)
const title = computed(() => confirmTitle.value)
const message = computed(() => confirmMessage.value)
const organ = computed(() => confirmOrgan.value)
const material = computed(() => confirmMaterial.value)

function handleConfirm() {
  confirmAction()
}

function handleCancel() {
  cancelAction()
}
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-modal {
  background: white;
  border: 2px solid black;
  padding: 30px;
  min-width: 400px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #333;
  border-bottom: 2px solid black;
  padding-bottom: 15px;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.confirm-message {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

.devour-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #fff3cd;
  border: 2px solid #ffc107;
}

.devour-label {
  font-size: 14px;
  font-weight: bold;
  color: #856404;
}

.organ-card {
  padding: 10px;
  background: white;
  border: 2px solid #ddd;
}

.organ-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.organ-gain {
  font-size: 14px;
  color: #666;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.action-btn {
  padding: 10px 30px;
  font-size: 16px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.primary {
    background: #2d5016;
    color: white;
    border-color: #2d5016;

    &:hover {
      background: #3d6026;
    }
  }
}
</style>
