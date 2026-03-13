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
          <div v-if="organ.describe" class="organ-description">
            {{ organ.describe }}
          </div>

          <div
            v-if="isSelected(organ.key) && actionMode === 'selectThenAction'"
            class="reward-action-buttons"
          >
            <button
              v-for="action in availableActions"
              :key="action.key"
              class="reward-action-btn"
              :class="{ active: getOrganAction(organ.key) === action.key }"
              @click.stop="selectAction(organ.key, action.key)"
              :disabled="!isActionEnabled(action, organ)"
            >
              <span class="reward-action-icon">{{ action.icon }}</span>
              <span class="reward-action-label">{{ action.label }}</span>
            </button>
          </div>

          <!-- 返回按钮：取消当前器官的选择 -->
          <div v-if="isSelected(organ.key)" class="organ-action-footer">
            <button class="back-btn" @click.stop="deselectOrgan(organ.key)">
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { currentOrganChoice, confirmOrganChoice } from '@/ui/hooks/interaction/organChoice'
import { getLazyModule } from '@/core/utils/lazyLoader'
import type { OrganMap } from '@/core/objects/target/Organ'
import { organRewardActionRegistry } from '@/static/registry/organRewardActionRegistry'
import type { OrganRewardAction } from '@/core/types/organRewardAction'
import { nowPlayer } from '@/core/objects/game/run'

const visible = computed(() => currentOrganChoice.value !== null)
const config = computed(() => currentOrganChoice.value)

const title = computed(() => config.value?.title || '选择器官')
const description = computed(() => config.value?.description || '')

// 将 organKeys 转换为 OrganMap 对象
const organOptions = computed(() => {
  if (!config.value?.organKeys) return []
  const organList = getLazyModule<OrganMap[]>('organList')
  return config.value.organKeys
    .map(key => organList.find(o => o.key === key))
    .filter((o): o is OrganMap => o !== undefined)
})

const selectCount = computed(() => config.value?.maxSelect || 1)
const actionMode = computed(() => config.value?.actionMode || 'selectOnly')

// 存储选中的器官
const selectedOrgans = ref<string[]>([])
// 存储每个器官选择的动作：organKey -> actionKey
const organActions = ref<Map<string, string>>(new Map())

// 获取可用动作
const availableActions = computed<OrganRewardAction[]>(() => {
  if (actionMode.value === 'selectOnly') return []

  // 如果配置指定了可用动作，过滤注册表
  if (config.value?.availableActions && config.value.availableActions.length > 0) {
    return config.value.availableActions
      .map(key => organRewardActionRegistry.getActionConfig(key))
      .filter((a): a is OrganRewardAction => a !== undefined)
      .sort((a, b) => b.priority - a.priority)
  }

  // 否则获取所有可用动作
  return organRewardActionRegistry.getAvailableActions(null, nowPlayer, { source: 'battleReward' })
})

// 监听配置变化，重置选择
watch(config, (newConfig) => {
  if (newConfig) {
    selectedOrgans.value = []
    organActions.value = new Map()
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
    organActions.value.delete(organKey)
  } else if (canSelect(organKey)) {
    // 未选中且可选择
    if (selectCount.value === 1) {
      // 单选模式，直接确认
      if (actionMode.value === 'selectOnly') {
        // selectOnly 模式直接返回
        confirmOrganChoice({
          selectedKeys: [organKey],
          selectedActions: new Map()
        })
      } else {
        // selectThenAction 模式，选中器官等待选动作
        selectedOrgans.value = [organKey]
      }
    } else {
      // 多选模式，添加选择
      selectedOrgans.value.push(organKey)
    }
  }
}

// 选择动作（为指定器官）
function selectAction(organKey: string, actionKey: string) {
  organActions.value.set(organKey, actionKey)

  // 选择动作后直接确认执行
  confirmOrganChoice({
    selectedKeys: selectedOrgans.value,
    selectedActions: organActions.value
  })
}

// 取消选择器官
function deselectOrgan(organKey: string) {
  const index = selectedOrgans.value.indexOf(organKey)
  if (index >= 0) {
    selectedOrgans.value.splice(index, 1)
    organActions.value.delete(organKey)
  }
}

// 获取器官当前选中的动作
function getOrganAction(organKey: string): string | undefined {
  return organActions.value.get(organKey)
}

// 检查动作是否可用
function isActionEnabled(action: OrganRewardAction, organ: OrganMap): boolean {
  if (typeof action.enabled === 'function') {
    // 这里需要创建临时 Organ 对象来检查
    return true  // 简化处理，实际可以更精确
  }
  return action.enabled
}

// 是否可以确认
const canConfirm = computed(() => {
  const hasSelectedEnough = selectedOrgans.value.length === selectCount.value
  if (actionMode.value === 'selectOnly') {
    return hasSelectedEnough
  }
  // selectThenAction 模式需要每个选中的器官都有动作
  return hasSelectedEnough && selectedOrgans.value.every(key => organActions.value.has(key))
})

// 确认选择
function handleConfirm() {
  if (!canConfirm.value) return

  // 构建返回结果：selectedKeys 和每个器官的 selectedActions
  confirmOrganChoice({
    selectedKeys: selectedOrgans.value,
    selectedActions: organActions.value
  })
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

.reward-action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #ddd;
}

.reward-action-btn {
  flex: 1;
  padding: 10px;
  background: white;
  border: 2px solid #ccc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;

  &:hover:not(:disabled) {
    border-color: #888;
    background: #f5f5f5;
  }

  &.active {
    border-color: #2d5016;
    background: #e8f5e9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reward-action-icon {
    font-size: 20px;
  }

  .reward-action-label {
    font-size: 14px;
    font-weight: bold;
  }
}

.organ-action-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.back-btn {
  padding: 6px 16px;
  font-size: 14px;
  background: white;
  border: 2px solid #ccc;
  cursor: pointer;

  &:hover {
    border-color: #888;
    background: #f5f5f5;
  }
}
</style>
