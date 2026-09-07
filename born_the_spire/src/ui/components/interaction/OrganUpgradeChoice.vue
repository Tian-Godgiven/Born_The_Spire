<template>
  <div class="organ-upgrade-choice">
    <div class="header">
      <h2>选择要升级的器官</h2>
      <button class="close-btn" @click="handleCancel">返回</button>
    </div>

    <div v-if="organs.length === 0" class="empty">
      没有可以升级的器官
    </div>

    <div v-else class="organ-list">
      <Popover
        v-for="organ in organs"
        :key="organ.key"
        placement="right"
        align="start"
        :max-width="280"
      >
        <div
          class="organ-item"
          :class="{ disabled: !canUpgrade(organ) }"
          @click="handleSelectOrgan(organ)"
        >
          <div class="organ-header">
            <span class="organ-name" :style="{ color: getRarityColor(organ.rarity) }">
              {{ organ.label }}
            </span>
            <span class="organ-level">Lv.{{ organ.level }}</span>
          </div>

          <div class="organ-info">
            <div class="organ-part" v-if="organ.part">
              部位: {{ getPartLabel(organ.part) }}
            </div>
            <div class="organ-quality">
              稀有度: {{ getRarityLabel(organ.rarity) }}
            </div>
            <div class="organ-mass" v-if="hasMaxMass(organ)">
              质量: {{ getCurrentMass(organ) }} / {{ getMaxMass(organ) }}
            </div>
          </div>

          <div class="upgrade-cost">
            <span v-if="canUpgrade(organ)">
              升级消耗: {{ getUpgradeCost(organ) }} 物质
            </span>
            <span v-else class="error">
              {{ getUpgradeError(organ) }}
            </span>
          </div>
        </div>

        <template #content>
          <OrganMilestoneTrack :organ="organ" />
        </template>
      </Popover>
    </div>

    <div class="player-info">
      <div class="health-info">
        当前物质: {{ currentMaterial }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { Player } from '@/core/objects/target/Player'
import {
  resolveOrganUpgradeCost,
  canContinueOrganUpgrade
} from '@/static/list/target/organQuality'
import { getRarityColor, getRarityLabel } from '@/static/list/system/rarityPalette'
import { getPartLabel } from '@/static/list/target/organPart'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import Popover from '@/ui/components/global/Popover.vue'
import OrganMilestoneTrack from '@/ui/components/interaction/OrganMilestoneTrack.vue'

const props = defineProps<{
  organs: Organ[]
  player: Player
}>()

const emit = defineEmits<{
  complete: [result: { organ: Organ, cost: number } | null]
  cancel: []
}>()

const currentMaterial = computed(() => getReserveModifier(props.player).getReserve('material'))

const lockedCosts = new Map<Organ, number>()
for (const organ of props.organs) {
  lockedCosts.set(organ, resolveOrganUpgradeCost(organ, { rollVariance: true }))
}

function getUpgradeCost(organ: Organ): number {
  return lockedCosts.get(organ) ?? resolveOrganUpgradeCost(organ)
}

function canUpgrade(organ: Organ): boolean {
  if (!canContinueOrganUpgrade(organ)) return false
  return currentMaterial.value >= getUpgradeCost(organ)
}

function getUpgradeError(organ: Organ): string {
  if (organ.isDisabled) return '器官已损坏'
  if (!canContinueOrganUpgrade(organ)) return '没有下一档'
  if (currentMaterial.value < getUpgradeCost(organ)) return '物质不足'
  return ''
}

function hasMaxMass(organ: Organ): boolean {
  try {
    return Number(getStatusValue(organ, 'max-mass')) > 0
  } catch {
    return false
  }
}

function getCurrentMass(organ: Organ): number {
  try {
    return getCurrentValue(organ, 'mass')
  } catch {
    return 0
  }
}

function getMaxMass(organ: Organ): number {
  try {
    return Number(getStatusValue(organ, 'max-mass'))
  } catch {
    return 0
  }
}

function handleSelectOrgan(organ: Organ) {
  if (!canUpgrade(organ)) return
  emit('complete', { organ, cost: getUpgradeCost(organ) })
}

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

  .empty {
    margin-bottom: 20px;
    padding: 16px;
    border: 2px solid black;
  }

  .organ-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
    max-height: 500px;
    overflow-y: auto;

    :deep(.popover-trigger) {
      display: block;
    }

    .organ-item {
      padding: 16px;
      border: 2px solid black;
      cursor: pointer;

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
        }
      }

      .organ-info {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .upgrade-cost {
        font-size: 14px;

        .error {
          color: red;
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
