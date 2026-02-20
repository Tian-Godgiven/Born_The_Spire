<template>
  <div class="battle-result-overlay" v-if="visible">
    <div class="battle-result-panel">
      <div class="result-title" :class="resultClass">
        {{ resultText }}
      </div>

      <div class="result-content">
        <div v-if="result === 'win'" class="win-content">
          <div class="stat-line">
            <span class="label">回合数：</span>
            <span class="value">{{ turnNumber }}</span>
          </div>
          <div class="stat-line">
            <span class="label">剩余生命：</span>
            <span class="value">{{ playerHealth }} / {{ playerMaxHealth }}</span>
          </div>
        </div>

        <div v-else class="lose-content">
          <div class="message">你已阵亡</div>
        </div>
      </div>

      <div class="result-actions">
        <button
          v-if="result === 'win'"
          class="action-btn primary"
          @click="handleContinue"
        >
          继续
        </button>

        <template v-else>
          <button
            class="action-btn"
            @click="handleRetry"
          >
            重试
          </button>
          <button
            class="action-btn"
            @click="handleMainMenu"
          >
            主菜单
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { nowBattle } from '@/core/objects/game/battle'
import { nowPlayer } from '@/core/objects/game/run'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'

const props = defineProps<{
  result: 'win' | 'lose'
  visible: boolean
}>()

const emit = defineEmits<{
  continue: []
  retry: []
  mainMenu: []
}>()

const resultText = computed(() => {
  return props.result === 'win' ? '战斗胜利' : '战斗失败'
})

const resultClass = computed(() => {
  return props.result === 'win' ? 'win' : 'lose'
})

const turnNumber = computed(() => {
  return nowBattle.value?.turnNumber ?? 0
})

const playerHealth = computed(() => {
  return Math.floor(getCurrentValue(nowPlayer, 'health'))
})

const playerMaxHealth = computed(() => {
  return Math.floor(getStatusValue(nowPlayer, 'max-health'))
})

function handleContinue() {
  emit('continue')
}

function handleRetry() {
  emit('retry')
}

function handleMainMenu() {
  emit('mainMenu')
}
</script>

<style scoped lang="scss">
.battle-result-overlay {
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

.battle-result-panel {
  background: white;
  border: 2px solid black;
  padding: 40px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.result-title {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px solid black;

  &.win {
    color: #2d5016;
  }

  &.lose {
    color: #8b0000;
  }
}

.result-content {
  padding: 20px 0;
}

.win-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  font-size: 18px;

  .label {
    color: #666;
  }

  .value {
    font-weight: bold;
  }
}

.lose-content {
  text-align: center;

  .message {
    font-size: 20px;
    color: #666;
  }
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.primary {
    background: #f0f0f0;
  }
}
</style>
