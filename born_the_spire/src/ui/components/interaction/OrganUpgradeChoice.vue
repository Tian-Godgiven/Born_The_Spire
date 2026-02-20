<template>
  <div class="organ-upgrade-choice">
    <div class="header">
      <h2>选择要升级的器官</h2>
      <button class="close-btn" @click="handleCancel">返回</button>
    </div>

    <div class="organ-list">
      <div
        v-for="organ in organs"
        :key="organ.key"
        class="organ-item"
        :class="{ disabled: !canUpgrade(organ) }"
        @click="handleSelectOrgan(organ)"
      >
        <div class="organ-header">
          <span class="organ-name" :style="{ color: getQualityColor(organ.quality) }">
            {{ organ.label }}
          </span>
          <span class="organ-level">Lv.{{ organ.level }}</span>
        </div>

        <div class="organ-info">
          <div class="organ-part" v-if="organ.part">
            部位: {{ getPartLabel(organ.part) }}
          </div>
          <div class="organ-quality">
            稀有度: {{ getQualityLabel(organ.quality) }}
          </div>
          <div class="organ-mass" v-if="hasMaxMass(organ)">
            质量: {{ getCurrentMass(organ) }} / {{ getMaxMass(organ) }}
          </div>
        </div>

        <div class="upgrade-cost">
          <span v-if="canUpgrade(organ)">
            升级消耗: {{ getUpgradeCost(organ) }} 生命值
          </span>
          <span v-else class="error">
            {{ getUpgradeError(organ) }}
          </span>
        </div>

        <div class="upgrade-effects" v-if="organ.upgradeConfig">
          <div v-if="organ.upgradeConfig.perLevel">
            每级效果: 通用提升
          </div>
          <div v-if="getNextMilestone(organ)" class="milestone">
            下个里程碑: Lv.{{ getNextMilestone(organ)!.level }}
          </div>
        </div>
      </div>
    </div>

    <div class="player-info">
      <div class="health-info">
        当前生命值: {{ currentHealth }} / {{ maxHealth }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { Player } from '@/core/objects/target/Player'
import { getQualityColor, getQualityLabel, calculateUpgradeCost } from '@/static/list/target/organQuality'
import { getPartLabel } from '@/static/list/target/organPart'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'

// Props
const props = defineProps<{
  organs: Organ[]
  player: Player
}>()

// Emits
const emit = defineEmits<{
  complete: [organ: Organ | null]
  cancel: []
}>()

// 计算当前生命值
const currentHealth = computed(() => getCurrentValue(props.player, 'health'))
const maxHealth = computed(() => getStatusValue(props.player, 'max-health'))

/**
 * 获取器官的升级成本
 */
function getUpgradeCost(organ: Organ): number {
  if (organ.upgradeConfig?.cost !== undefined) {
    if (typeof organ.upgradeConfig.cost === 'function') {
      return organ.upgradeConfig.cost(organ)
    }
    return organ.upgradeConfig.cost
  }
  return calculateUpgradeCost(organ.quality, organ.absorbValue, false)
}

/**
 * 检查是否可以升级
 */
function canUpgrade(organ: Organ): boolean {
  if (organ.isDisabled) return false
  const cost = getUpgradeCost(organ)
  return currentHealth.value > cost
}

/**
 * 获取升级错误信息
 */
function getUpgradeError(organ: Organ): string {
  if (organ.isDisabled) return '器官已损坏'
  const cost = getUpgradeCost(organ)
  if (currentHealth.value <= cost) return '生命值不足'
  return ''
}

/**
 * 检查器官是否有质量属性
 */
function hasMaxMass(organ: Organ): boolean {
  try {
    return getStatusValue(organ, 'max-mass') > 0
  } catch {
    return false
  }
}

/**
 * 获取当前质量
 */
function getCurrentMass(organ: Organ): number {
  try {
    return getCurrentValue(organ, 'mass')
  } catch {
    return 0
  }
}

/**
 * 获取最大质量
 */
function getMaxMass(organ: Organ): number {
  try {
    return getStatusValue(organ, 'max-mass')
  } catch {
    return 0
  }
}

/**
 * 获取下一个里程碑
 */
function getNextMilestone(organ: Organ) {
  if (!organ.upgradeConfig?.milestones) return null
  return organ.upgradeConfig.milestones.find(m => m.level > organ.level)
}

/**
 * 选择器官
 */
function handleSelectOrgan(organ: Organ) {
  if (!canUpgrade(organ)) return
  emit('complete', organ)
}

/**
 * 取消
 */
function handleCancel() {
  emit('complete', null)
}
</script>

<style scoped lang="scss">
.organ-upgrade-choice {
  padding: 20px;
  min-width: 600px;
  max-width: 800px;
  background: white;

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

  .organ-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    max-height: 500px;
    overflow-y: auto;

    .organ-item {
      padding: 16px;
      border: 2px solid black;
      cursor: pointer;
      transition: background 0.2s;

      &:hover:not(.disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .organ-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .organ-name {
          font-size: 18px;
          font-weight: bold;
        }

        .organ-level {
          font-size: 16px;
          color: #666;
        }
      }

      .organ-info {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
      }

      .upgrade-cost {
        margin-bottom: 8px;
        font-size: 14px;

        .error {
          color: red;
        }
      }

      .upgrade-effects {
        font-size: 12px;
        color: #888;

        .milestone {
          color: #0070DD;
          font-weight: bold;
        }
      }
    }
  }

  .player-info {
    padding: 12px;
    border: 2px solid black;
    background: rgba(0, 0, 0, 0.02);

    .health-info {
      font-size: 16px;
      font-weight: bold;
    }
  }
}
</style>
