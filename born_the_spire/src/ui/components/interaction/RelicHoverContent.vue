<template>
<div class="relic-tooltip" ref="tooltipRef">
    <div class="tooltip-header">
        <span class="relic-name">{{ relic.label }}</span>
        <span class="relic-rarity" v-if="relic.rarity" :style="{ color: getRarityColor(relic.rarity) }">[{{ rarityText }}]</span>
        <span class="ability-badge" v-if="hasMultipleAbilities">⚡ 主动</span>
    </div>
    <div class="tooltip-body">
        <div class="relic-description">
            <DescribeText
                :describe="effectDescribe"
                :target="relic"
                :glossary-anchor="tooltipRef"
                :glossary-order="1"
                ref-placement="right"
                ref-align="start"
            />
        </div>
        <div class="relic-abilities" v-if="hasMultipleAbilities">
            <div class="abilities-title">主动能力：</div>
            <div v-for="(ability, index) in relic.activeAbilities" :key="index" class="ability-item">
                <div class="ability-label">{{ ability.label }}</div>
                <div class="ability-desc">
                    <DescribeText :describe="ability.describe" :target="relic" glossary-disabled />
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import DescribeText from "@/ui/components/display/DescribeText.vue"
import { getEffectDescribe } from "@/ui/hooks/express/describe"
import { getRarityColor, getRarityLabel } from "@/static/list/system/rarityPalette"

const { relic } = defineProps<{
    relic: Relic
}>()

const tooltipRef = ref<HTMLElement>()

const effectDescribe = computed(() => getEffectDescribe(relic))

const hasMultipleAbilities = computed(() => {
    return (relic.activeAbilities?.length ?? 0) > 1
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

        .ability-badge {
            margin-left: auto;
            background-color: #3b82f6;
            color: white;
            font-size: 11px;
            padding: 1px 6px;
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
