<template>
  <div class="organ-upgrade-choice">
    <div class="header">
      <h2>选择要升级的器官</h2>
      <div class="material">物质：{{ currentMaterial }}</div>
      <Button :click="handleCancel" label="返回" />
    </div>

    <div v-if="organs.length === 0" class="empty">
      没有可以升级的器官
    </div>

    <div v-else class="organ-list">
      <div v-for="organ in organs" :key="organ.key" class="organ-item">
        <Popover
          trigger="click"
          placement="right"
          align="start"
          :max-width="organHoverMaxWidth(organ)"
        >
          <div class="organ-summary">
            <span class="organ-name">{{ organ.label }}</span>
            <span class="organ-level">Lv.{{ organ.level }}</span>
            <span class="organ-part" v-if="organ.part">[{{ getPartLabel(organ.part) }}]</span>
            <span class="organ-rarity" :style="{ color: getRarityColor(organ.rarity) }">
              {{ getRarityLabel(organ.rarity) }}
            </span>
            <span class="organ-mass" v-if="hasMaxMass(organ)">
              质量：{{ getCurrentMass(organ) }}/{{ getMaxMass(organ) }}
            </span>
          </div>
          <template #content>
            <OrganHoverContent :organ="organ" />
          </template>
        </Popover>

        <div @click.stop>
          <Button
            :click="() => handleSelectOrgan(organ)"
            :disabled="!canUpgrade(organ)"
            :error="!canUpgrade(organ)"
          >
            <template v-if="canUpgrade(organ)">升级消耗 {{ getUpgradeCost(organ) }} 物质</template>
            <template v-else>{{ getUpgradeError(organ) }}</template>
          </Button>
        </div>
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
import Button from '@/ui/components/global/Button.vue'
import OrganHoverContent, { organHoverMaxWidth } from '@/ui/components/interaction/OrganHoverContent.vue'

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
  display: flex;
  flex-direction: column;
  min-width: 600px;
  max-width: 800px;
  max-height: 80vh;
  background: white;
  overflow: hidden;

  .header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 2px solid black;

    h2 {
      margin: 0;
      font-size: var(--layout-modal-title-size);
      flex: 1;
      min-width: 0;
    }

    .material {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: bold;
      white-space: nowrap;
    }
  }

  .empty {
    margin: 16px;
    padding: 16px;
    border: 2px solid black;
  }

  .organ-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;

    .organ-item {
      display: flex;
      align-items: stretch;
      gap: 12px;
      padding: 12px;
      border: 2px solid black;

      > div:last-child {
        flex-shrink: 0;
        align-self: center;
      }
    }

    :deep(.popover-trigger) {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
    }

    .organ-summary {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 10px;
      font-size: 14px;
      cursor: pointer;
      line-height: 1.4;
    }

    .organ-name {
      font-size: 16px;
      font-weight: bold;
    }
  }
}
</style>
