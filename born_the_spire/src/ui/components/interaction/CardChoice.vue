<template>
  <div class="card-choice">
    <div class="card-panel">
      <div class="header">
        <h2>{{ title }}</h2>
        <button v-if="cancelable" class="close-btn" @click="handleCancel">取消</button>
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
    </div>

    <button
      class="confirm-btn"
      @click="handleConfirm"
      :disabled="!canConfirm"
    >
      确认
    </button>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, computed, type PropType } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import CardVue from '@/ui/components/object/Card.vue'
import type { CardSelector } from '@/core/objects/system/CardSelector'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: false },
  cards: { type: Array as PropType<Card[]>, required: true },
  selector: { type: Object as PropType<CardSelector>, required: false },
  minSelect: { type: Number, default: 0 },
  maxSelect: { type: Number, default: 1 },
  cancelable: { type: Boolean, default: false },
  filter: { type: Function as PropType<(card: Card) => boolean>, required: false }
})

const emit = defineEmits<{
  complete: [cards: Card[]]
  cancel: []
}>()

// 已选择的卡牌（使用 shallowRef 避免深度响应式）
const selectedCards = shallowRef<Card[]>([])

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
  return selectedCards.value.some(c => c.__id === card.__id)
}

// 检查是否可以选择该卡牌
function canSelect(card: Card): boolean {
  if (isSelected(card)) return true
  if (selectedCards.value.length >= maxSelect.value) return false
  return true
}

// 必须选满 minSelect 张才能确认；minSelect 为 0 时可以空确认
const canConfirm = computed(() => {
  const n = selectedCards.value.length
  return n >= minSelect.value && n <= maxSelect.value
})

function handleSelectCard(card: Card) {
  if (!canSelect(card)) return

  if (isSelected(card)) {
    selectedCards.value = selectedCards.value.filter(c => c.__id !== card.__id)
    return
  }

  if (maxSelect.value === 1) {
    selectedCards.value = [card]
  } else {
    selectedCards.value = [...selectedCards.value, card]
  }
}

// 确认选择
function handleConfirm() {
  if (!canConfirm.value) return
  emit('complete', [...selectedCards.value] as Card[])
}

// 取消选择
function handleCancel() {
  emit('cancel')
}
</script>

<style scoped lang="scss">
.card-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: min(900px, 92vw);
  max-height: 90vh;
  background: transparent;
}

.card-panel {
  display: flex;
  flex-direction: column;
  min-width: min(600px, 100%);
  width: 100%;
  min-height: 0;
  max-height: calc(90vh - 72px);
  background: white;
  border: 2px solid black;
  overflow: hidden;
}

.header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 2px solid black;

  h2 {
    margin: 0;
    font-size: var(--layout-modal-title-size);
  }

  .close-btn {
    padding: 6px 12px;
    border: 2px solid black;
    background: white;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

.card-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  justify-content: center;

  .card-item {
    position: relative;
    cursor: pointer;

    &.selected {
      outline: 2px solid black;
      outline-offset: 2px;

      &::after {
        content: '✓';
        position: absolute;
        top: 5px;
        right: 5px;
        width: 30px;
        height: 30px;
        background: black;
        color: white;
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

.confirm-btn {
  flex-shrink: 0;
  padding: 10px 32px;
  border: 2px solid black;
  background: black;
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;

  &:hover:not(:disabled) {
    background: #222;
  }

  &:disabled {
    background: #999;
    border-color: #999;
    color: #eee;
    cursor: not-allowed;
  }
}
</style>
