<template>
  <div class="card-choice">
    <div class="header">
      <h2>{{ title }}</h2>
      <button v-if="cancelable" class="close-btn" @click="handleCancel">取消</button>
    </div>

    <div class="description" v-if="description">
      {{ description }}
    </div>

    <div class="card-list">
      <div
        v-for="card in availableCards"
        :key="card.__id"
        class="card-item"
        :class="{
          selected: isSelected(card),
          disabled: !canSelect(card)
        }"
        @click="handleSelectCard(card)"
      >
        <CardVue :card="card" />
      </div>
    </div>

    <div class="footer">
      <div class="selection-info">
        已选择: {{ selectedCards.length }} / {{ maxSelect === Infinity ? '∞' : maxSelect }}
        <span v-if="minSelect > 0" class="min-hint">
          (至少选择 {{ minSelect }} 张)
        </span>
      </div>
      <button
        class="confirm-btn"
        @click="handleConfirm"
        :disabled="!canConfirm"
      >
        确认
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card } from '@/core/objects/item/Subclass/Card'
import CardVue from '@/ui/components/object/Card.vue'
import type { CardSelector } from '@/core/objects/system/CardSelector'

const props = defineProps<{
  title: string                    // 标题
  description?: string             // 描述文本
  cards: Card[]                    // 可选卡牌列表
  selector?: CardSelector          // 筛选器（可选）
  minSelect?: number               // 最少选择数量（默认0）
  maxSelect?: number               // 最多选择数量（默认1）
  cancelable?: boolean             // 是否可取消（默认true）
  filter?: (card: Card) => boolean // 自定义筛选函数（可选）
}>()

const emit = defineEmits<{
  complete: [cards: Card[]]
  cancel: []
}>()

// 已选择的卡牌
const selectedCards = ref<Card[]>([])

// 默认值
const minSelect = computed(() => props.minSelect ?? 0)
const maxSelect = computed(() => props.maxSelect ?? 1)
const cancelable = computed(() => props.cancelable ?? false)

// 可选卡牌列表（应用筛选器）
const availableCards = computed(() => {
  let filtered = [...props.cards]

  // 应用自定义筛选函数
  if (props.filter) {
    filtered = filtered.filter(props.filter)
  }

  // 应用 CardSelector（如果需要更复杂的筛选，可以在这里集成）

  return filtered
})

// 检查卡牌是否已选中
function isSelected(card: Card): boolean {
  return selectedCards.value.includes(card)
}

// 检查是否可以选择该卡牌
function canSelect(card: Card): boolean {
  // 如果已选中，总是可以点击（用于取消选择）
  if (isSelected(card)) return true

  // 如果已达到最大选择数量，不能再选
  if (selectedCards.value.length >= maxSelect.value) return false

  return true
}

// 检查是否可以确认
const canConfirm = computed(() => {
  return selectedCards.value.length >= minSelect.value &&
         selectedCards.value.length <= maxSelect.value
})

// 选择/取消选择卡牌
function handleSelectCard(card: Card) {
  if (!canSelect(card)) return

  const index = selectedCards.value.indexOf(card)

  if (index >= 0) {
    // 已选中，取消选择
    selectedCards.value.splice(index, 1)
  } else {
    // 未选中，添加选择
    if (maxSelect.value === 1) {
      // 单选模式：替换当前选择
      selectedCards.value = [card]
    } else {
      // 多选模式：添加到列表
      selectedCards.value.push(card)
    }
  }
}

// 确认选择
function handleConfirm() {
  if (!canConfirm.value) return
  emit('complete', [...selectedCards.value])
}

// 取消选择
function handleCancel() {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.card-choice {
  padding: 20px;
  min-width: 600px;
  max-width: 900px;
  background: white;
  border: 2px solid black;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid black;

    h2 {
      margin: 0;
      font-size: 24px;
    }

    .close-btn {
      padding: 8px 16px;
      border: 2px solid black;
      background: white;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }

  .description {
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .card-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    max-height: 500px;
    overflow-y: auto;
    padding: 10px;

    .card-item {
      position: relative;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover:not(.disabled) {
        transform: scale(1.05);
      }

      &.selected {
        &::after {
          content: '✓';
          position: absolute;
          top: 5px;
          right: 5px;
          width: 30px;
          height: 30px;
          background: black;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
        }
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 2px solid black;
    background: rgba(0, 0, 0, 0.02);

    .selection-info {
      font-size: 16px;
      font-weight: bold;

      .min-hint {
        font-size: 14px;
        font-weight: normal;
        color: #666;
      }
    }

    .confirm-btn {
      padding: 10px 20px;
      border: 2px solid black;
      background: white;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
