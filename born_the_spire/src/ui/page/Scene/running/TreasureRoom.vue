<template>
  <div class="treasure-room">
    <div class="treasure-container">
      <!-- 宝箱图标 -->
      <div class="chest-icon" @click="openChest" :class="{ opened: isOpened }">
        {{ isOpened ? '📭' : '📦' }}
      </div>

      <!-- 提示文字 -->
      <div class="chest-hint" v-if="!isOpened">
        点击打开宝箱
      </div>

      <!-- 已打开提示 -->
      <div class="chest-opened" v-else>
        宝箱已打开
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { TreasureRoom } from '@/core/objects/room/TreasureRoom'
import { completeAndGoNext } from '@/core/hooks/step'

const room = nowGameRun.currentRoom as TreasureRoom
const isOpened = ref(false)

async function openChest() {
  if (isOpened.value) return

  isOpened.value = true

  // 调用房间完成逻辑（会显示奖励UI）
  await room.complete()

  // 奖励领取完毕后，自动前往下一步
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.chest-icon {
  font-size: 120px;
  cursor: pointer;
  transition: transform 0.2s;
  user-select: none;

  &:hover:not(.opened) {
    transform: scale(1.1);
  }

  &.opened {
    cursor: default;
    opacity: 0.6;
  }
}

.chest-hint {
  font-size: 18px;
  color: #666;
}

.chest-opened {
  font-size: 18px;
  color: #999;
}
</style>
