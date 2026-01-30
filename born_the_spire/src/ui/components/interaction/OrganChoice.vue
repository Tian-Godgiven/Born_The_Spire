<template>
  <div class="organ-choice-overlay" v-if="visible">
    <div class="organ-choice-panel">
      <div class="choice-title">{{ title }}</div>

      <div v-if="description" class="choice-description">
        {{ description }}
      </div>

      <div class="selection-info">
        选择 {{ selectedOrgans.length }} / {{ selectCount }}
      </div>

      <div class="organ-list">
        <div
          v-for="organ in organOptions"
          :key="organ.key"
          class="organ-card"
          :class="{ selected: isSelected(organ.key), disabled: !canSelect(organ.key) }"
          @click="toggleSelection(organ.key)"
        >
          <div class="organ-name">{{ organ.label }}</div>
          <div v-if="organ.description" class="organ-description">
            {{ organ.description }}
          </div>
        </div>
      </div>

      <div class="choice-actions">
        <button
          class="action-btn primary"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { currentOrganChoice, confirmOrganChoice } from '@/ui/hooks/interaction/organChoice'

const visible = computed(() => currentOrganChoice.value !== null)
const config = computed(() => currentOrganChoice.value)

const title = computed(() => config.value?.title || '选择器官')
const description = computed(() => config.value?.description || '')
const organOptions = computed(() => config.value?.organOptions || [])
const selectCount = computed(() => config.value?.selectCount || 1)

const selectedOrgans = ref<string[]>([])

// 监听配置变化，重置选择
watch(config, (newConfig) => {
  if (newConfig) {
    selectedOrgans.value = []
  }
})

// 是否已选择
function isSelected(organKey: string): boolean {
  return selectedOrgans.value.includes(organKey)
}

// 是否可以选择
function canSelect(organKey: string): boolean {
  if (isSelected(organKey)) return true
  return selectedOrgans.value.length < selectCount.value
}

// 切换选择
function toggleSelection(organKey: string) {
  const index = selectedOrgans.value.indexOf(organKey)

  if (index >= 0) {
    // 已选中，取消选择
    selectedOrgans.value.splice(index, 1)
  } else if (canSelect(organKey)) {
    // 未选中且可选择
    if (selectCount.value === 1) {
      // 单选模式，替换选择
      selectedOrgans.value = [organKey]
    } else {
      // 多选模式，添加选择
      selectedOrgans.value.push(organKey)
    }
  }
}

// 是否可以确认
const canConfirm = computed(() => {
  return selectedOrgans.value.length === selectCount.value
})

// 确认选择
function handleConfirm() {
  if (canConfirm.value) {
    confirmOrganChoice(selectedOrgans.value)
  }
}
</script>

<style scoped lang="scss">
.organ-choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.organ-choice-panel {
  background: white;
  border: 2px solid black;
  padding: 40px;
  min-width: 600px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.choice-title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  color: #333;
  border-bottom: 2px solid black;
  padding-bottom: 15px;
}

.choice-description {
  font-size: 16px;
  color: #666;
  text-align: center;
}

.selection-info {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #2d5016;
}

.organ-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.organ-card {
  padding: 20px;
  border: 2px solid #ccc;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    border-color: #888;
    background: #f5f5f5;
  }

  &.selected {
    border-color: #2d5016;
    background: #e8f5e9;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.organ-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.organ-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.choice-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.action-btn {
  padding: 12px 40px;
  font-size: 16px;
  font-weight: bold;
  background: white;
  border: 2px solid black;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: #f0f0f0;
  }
}
</style>
