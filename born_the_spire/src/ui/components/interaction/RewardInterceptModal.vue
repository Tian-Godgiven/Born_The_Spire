<template>
  <div class="intercept-overlay" v-if="visible && config">
    <div class="intercept-modal">
      <div class="intercept-title">{{ config.title }}</div>

      <div class="intercept-content">
        <div class="intercept-description">{{ config.description }}</div>

        <div class="reward-preview">
          <span class="reward-icon">{{ config.reward.getDisplayIcon() }}</span>
          <span class="reward-text">{{ config.reward.getDisplayTitle() }}</span>
        </div>
      </div>

      <div class="intercept-actions">
        <template v-if="!config.forced">
          <button class="action-btn" @click="choose('yield')">
            {{ config.yieldLabel ?? '让给它' }}
          </button>
          <button class="action-btn primary" @click="choose('grab')">
            {{ config.grabLabel ?? '抢过来' }}
          </button>
        </template>
        <template v-else>
          <button class="action-btn" @click="choose('yield')">
            {{ config.forcedLabel ?? '（已被强制占据）我知道了' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  showInterceptModal,
  interceptConfig,
  resolveIntercept,
  type InterceptChoice
} from '@/ui/hooks/interaction/rewardIntercept'

const visible = computed(() => showInterceptModal.value)
const config = computed(() => interceptConfig.value)

function choose(c: InterceptChoice) {
  resolveIntercept(c)
}
</script>

<style scoped lang="scss">
.intercept-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.intercept-modal {
  background: white;
  border: 2px solid black;
  padding: 30px;
  min-width: 400px;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.intercept-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #333;
  border-bottom: 2px solid black;
  padding-bottom: 15px;
}

.intercept-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.intercept-description {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
}

.reward-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #333;
}

.reward-icon {
  font-size: 20px;
}

.reward-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.intercept-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-top: 10px;
  border-top: 2px solid #ddd;
}

.action-btn {
  padding: 10px 24px;
  font-size: 15px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;
  transition: background 0.2s;

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
