<template>
  <div class="floor-select-room">
    <div class="floor-select-container">
      <!-- 标题 -->
      <div class="title">{{ choiceGroup.title }}</div>
      <div class="description">{{ choiceGroup.description }}</div>

      <!-- 楼层选项 -->
      <div class="floor-options">
        <div
          v-for="choice in choiceGroup.choices"
          :key="choice.__key"
          class="floor-option"
          :class="{ selected: selectedChoice === choice }"
          @click="selectFloor(choice)"
        >
          <div class="floor-icon">{{ choice.icon }}</div>
          <div class="floor-info">
            <div class="floor-name">{{ choice.title }}</div>
            <div class="floor-desc">{{ choice.description }}</div>
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <button
        class="confirm-button"
        :disabled="!selectedChoice"
        @click="confirmSelection"
      >
        确认选择
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { FloorSelectRoom } from '@/core/objects/room/FloorSelectRoom'
import type { Choice } from '@/core/objects/system/Choice'

const room = nowGameRun.currentRoom as FloorSelectRoom
const choiceGroup = room.getChoiceGroup()
const selectedChoice = ref<Choice | null>(null)

function selectFloor(choice: Choice) {
  selectedChoice.value = choice
}

async function confirmSelection() {
  if (!selectedChoice.value) return

  // 调用选项组的完成回调
  await choiceGroup.complete()
}
</script>

<style scoped lang="scss">
.floor-select-room {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
}

.floor-select-container {
  max-width: 800px;
  padding: 40px;
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 16px;
  color: black;
}

.description {
  font-size: 18px;
  margin-bottom: 40px;
  color: #666;
}

.floor-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.floor-option {
  display: flex;
  align-items: center;
  padding: 24px;
  border: 2px solid black;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.selected {
    background: rgba(0, 0, 0, 0.1);
    border-width: 3px;
  }
}

.floor-icon {
  font-size: 48px;
  margin-right: 24px;
}

.floor-info {
  flex: 1;
  text-align: left;
}

.floor-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: black;
}

.floor-desc {
  font-size: 16px;
  color: #666;
}

.confirm-button {
  padding: 16px 48px;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid black;
  background: white;
  color: black;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}
</style>
