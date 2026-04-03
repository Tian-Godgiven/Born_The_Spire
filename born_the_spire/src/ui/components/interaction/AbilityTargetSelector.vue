<template>
  <div v-if="visible" class="target-selector-overlay">
    <div class="target-selector-header">
      <h3>{{ title || '选择目标' }}</h3>
      <button class="cancel-btn" @click="cancel">取消</button>
    </div>

    <div class="target-selector-content">
      <div class="target-hint">
        {{ hint || '点击选择目标' }}
      </div>

      <div v-if="selectedTargets.length > 0" class="selected-targets">
        <div class="selected-label">已选择:</div>
        <div class="selected-list">
          <div
            v-for="target in selectedTargets"
            :key="target.__id"
            class="selected-target"
            @click="unselectTarget(target)"
          >
            {{ target.label }}
            <span class="remove-icon">×</span>
          </div>
        </div>
      </div>

      <div v-if="canConfirm" class="confirm-section">
        <button class="confirm-btn" @click="confirm">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import { Entity } from '@/core/objects/system/Entity'
// import { AbilityTargetConfig } from '@/core/types/ActiveAbility'

interface TargetConfig {
    type: string
    count?: { min: number; max: number }
    filter?: (target: Entity) => boolean
}

const props = defineProps({
    targetConfig: { type: Object as PropType<TargetConfig>, required: true }
})

const emit = defineEmits<{
  confirm: [targets: Entity[]]
  cancel: []
}>()

const visible = ref(false)
const selectedTargets = ref<Entity[]>([])
const title = ref<string>('')
const hint = ref<string>('')

const canConfirm = computed(() => {
  const count = selectedTargets.value.length
  const min = props.targetConfig.count?.min ?? 1
  const max = props.targetConfig.count?.max ?? 1

  return count >= min && count <= max
})

function show(customTitle?: string, customHint?: string) {
  visible.value = true
  selectedTargets.value = []
  title.value = customTitle || ''
  hint.value = customHint || ''
}

function hide() {
  visible.value = false
  selectedTargets.value = []
}

function selectTarget(target: Entity) {
  const max = props.targetConfig.count?.max ?? 1

  if (selectedTargets.value.length >= max) {
    if (max === 1) {
      selectedTargets.value = [target]
    }
    return
  }

  if (!selectedTargets.value.find(t => t.__id === target.__id)) {
    selectedTargets.value.push(target)
  }

  if (max === 1 && selectedTargets.value.length === 1) {
    confirm()
  }
}

function unselectTarget(target: Entity) {
  selectedTargets.value = selectedTargets.value.filter(t => t.__id !== target.__id)
}

function confirm() {
  if (!canConfirm.value) return

  emit('confirm', selectedTargets.value)
  hide()
}

function cancel() {
  emit('cancel')
  hide()
}

defineExpose({
  show,
  hide,
  selectTarget
})
</script>

<style scoped>
.target-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
  pointer-events: none;
}

.target-selector-header {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 2px solid black;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  pointer-events: auto;
}

.target-selector-header h3 {
  margin: 0;
  font-size: 16px;
}

.cancel-btn {
  background: white;
  border: 2px solid black;
  padding: 4px 12px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.target-selector-content {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 2px solid black;
  padding: 16px;
  min-width: 300px;
  z-index: 1000;
  pointer-events: auto;
}

.target-hint {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  text-align: center;
}

.selected-targets {
  margin-bottom: 12px;
}

.selected-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-target {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid black;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.selected-target:hover {
  background: rgba(0, 0, 0, 0.1);
}

.remove-icon {
  font-size: 16px;
  font-weight: bold;
}

.confirm-section {
  display: flex;
  justify-content: center;
}

.confirm-btn {
  background: white;
  border: 2px solid black;
  padding: 8px 24px;
  cursor: pointer;
  font-weight: bold;
}

.confirm-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>