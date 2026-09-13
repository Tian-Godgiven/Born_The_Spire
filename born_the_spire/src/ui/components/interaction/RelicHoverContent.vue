<template>
<div class="relic-tooltip">
    <div class="tooltip-header">
        <span class="relic-name">{{ relic.label }}</span>
        <span class="relic-rarity" v-if="relic.rarity" :style="{ color: getRarityColor(relic.rarity) }">[{{ rarityText }}]</span>
    </div>
    <div class="tooltip-body">
        <div class="relic-description">
            {{ getDescribe(relic.describe, relic) }}
        </div>
        <div class="relic-abilities" v-if="hasActiveAbilities">
            <div class="abilities-title">主动能力：</div>
            <div v-for="(ability, index) in relic.activeAbilities" :key="index" class="ability-item">
                <div class="ability-label">{{ ability.label }}</div>
                <div class="ability-desc">{{ getDescribe(ability.describe, relic) }}</div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import { getDescribe } from "@/ui/hooks/express/describe"
import { getRarityColor, getRarityLabel } from "@/static/list/system/rarityPalette"

const { relic } = defineProps<{
    relic: Relic
}>()

const hasActiveAbilities = computed(() => {
    return relic.activeAbilities && relic.activeAbilities.length > 0
})

const rarityText = computed(() => getRarityLabel(relic.rarity))
</script>

<style scoped lang="scss">
.relic-tooltip {
    background: white;
    border: 2px solid black;
    min-width: 200px;
    max-width: 350px;

    .tooltip-header {
        padding: 8px 12px;
        border-bottom: 2px solid black;
        display: flex;
        align-items: center;
        gap: 8px;

        .relic-name {
            font-weight: bold;
            font-size: 14px;
        }

        .relic-rarity {
            font-size: 12px;
        }
    }

    .tooltip-body {
        padding: 8px 12px;

        .relic-description {
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .relic-abilities {
            border-top: 1px solid #ccc;
            padding-top: 8px;
            margin-top: 8px;

            .abilities-title {
                font-weight: bold;
                margin-bottom: 6px;
                font-size: 12px;
            }

            .ability-item {
                margin-bottom: 6px;
                padding: 6px;
                border: 1px solid #ccc;
                background: #f9f9f9;

                &:last-child {
                    margin-bottom: 0;
                }

                .ability-label {
                    font-weight: bold;
                    margin-bottom: 2px;
                    font-size: 12px;
                }

                .ability-desc {
                    font-size: 11px;
                    color: #666;
                    line-height: 1.4;
                }
            }
        }
    }
}
</style>
