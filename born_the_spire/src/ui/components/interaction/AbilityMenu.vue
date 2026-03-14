<template>
  <div v-if="visible" class="ability-menu-overlay" @click="handleOverlayClick">
    <div class="ability-menu" @click.stop>
      <div class="menu-header">
        <h3>{{ menuConfig.title || '选择能力' }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="menu-content">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="menu-item"
          :class="{ disabled: item.disabled }"
          @click="handleItemClick(item)"
        >
          <div class="item-icon">
            <span v-if="item.type === 'ability'">⚡</span>
            <span v-else>🔧</span>
          </div>

          <div class="item-content">
            <div class="item-label">{{ item.label }}</div>
            <div v-if="item.description" class="item-description">{{ item.description }}</div>
            <div v-if="item.unavailableReason" class="item-reason">{{ item.unavailableReason }}</div>
          </div>

          <div v-if="item.cost" class="item-cost">
            <span v-for="(cost, costType) in item.cost" :key="costType" class="cost-item">
              {{ costType }}: {{ cost }}
            </span>
          </div>
        </div>
      </div>

      <div class="menu-footer">
        <button @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Entity } from '@/core/objects/system/Entity'
import type { ActiveAbility, AbilityMenuConfig } from '@/core/types/ActiveAbility'
import { checkAbilityUsability } from '@/core/hooks/activeAbility'
import { getDescribe } from '@/ui/hooks/express/describe'

interface MenuItemData {
  type: 'ability' | 'callback'
  label: string
  description?: string
  disabled: boolean
  unavailableReason?: string
  cost?: Record<string, number>
  abilityKey?: string
  callback?: Function
}

interface Props {
  item: Entity
  owner: Entity
  abilities: ActiveAbility[]
  menuConfig: AbilityMenuConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectAbility: [abilityKey: string]
  selectCallback: [callback: Function]
  close: []
}>()

const visible = ref(false)

const menuItems = computed<MenuItemData[]>(() => {
  const items: MenuItemData[] = []

  for (const menuItem of props.menuConfig.items) {
    if (menuItem.type === 'ability') {
      const ability = props.abilities.find(a => a.key === menuItem.abilityKey)
      if (ability) {
        const usability = checkAbilityUsability(props.item, ability, props.owner)

        items.push({
          type: 'ability',
          label: ability.label,
          description: ability.describe ? getDescribe(ability.describe) : undefined,
          disabled: !usability.canUse,
          unavailableReason: usability.reason,
          cost: ability.restrictions?.costs,
          abilityKey: ability.key
        })
      }
    } else if (menuItem.type === 'callback') {
      items.push({
        type: 'callback',
        label: menuItem.label || '自定义选项',
        description: menuItem.describe ? getDescribe(menuItem.describe) : undefined,
        disabled: false,
        callback: menuItem.callback
      })
    }
  }

  return items
})

function show() {
  visible.value = true
}

function close() {
  visible.value = false
  emit('close')
}

function handleOverlayClick() {
  close()
}

function handleItemClick(item: MenuItemData) {
  if (item.disabled) return

  if (item.type === 'ability' && item.abilityKey) {
    emit('selectAbility', item.abilityKey)
  } else if (item.type === 'callback' && item.callback) {
    emit('selectCallback', item.callback)
  }

  close()
}

defineExpose({
  show,
  close
})
</script>

<style scoped>
.ability-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ability-menu {
  background: white;
  border: 2px solid black;
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.menu-header {
  padding: 12px 16px;
  border-bottom: 2px solid black;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.menu-item:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.item-content {
  flex: 1;
}

.item-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.item-reason {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.item-cost {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.cost-item {
  font-size: 11px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 2px;
}

.menu-footer {
  padding: 12px 16px;
  border-top: 2px solid black;
  display: flex;
  justify-content: flex-end;
}

.menu-footer button {
  background: white;
  border: 2px solid black;
  padding: 6px 12px;
  cursor: pointer;
}

.menu-footer button:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>