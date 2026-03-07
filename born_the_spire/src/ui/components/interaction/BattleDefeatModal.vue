<template>
  <div v-if="visible" class="defeat-modal-overlay">
    <div class="defeat-modal">
      <div class="modal-title">战斗失败</div>
      <div class="modal-description">你的本次挑战失败了。</div>

      <div class="modal-actions">
        <button class="action-btn" @click="handleRetry">
          重试当前房间
        </button>
        <button class="action-btn primary" @click="handleBackToMainMenu">
          返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { showDefeatModal, hideBattleDefeat } from '@/ui/hooks/interaction/battleDefeat'
import { retryCurrentRoom, backToMainMenu } from '@/core/hooks/game'

const visible = computed(() => showDefeatModal.value)

async function handleRetry() {
  hideBattleDefeat()
  await retryCurrentRoom()
}

async function handleBackToMainMenu() {
  hideBattleDefeat()
  await backToMainMenu()
}
</script>

<style scoped lang="scss">
.defeat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1003;
}

.defeat-modal {
  background: white;
  border: 2px solid black;
  padding: 40px;
  min-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
}

.modal-title {
  font-size: 32px;
  font-weight: bold;
}

.modal-description {
  font-size: 18px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid black;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
  }

  &.primary {
    background: black;
    color: white;

    &:hover {
      background: #222;
    }

    &:active {
      background: #111;
    }
  }
}
</style>
