<template>
<div class="relic-detail">
    <Mask></Mask>
    <div class="container">
        <!-- 左箭头 -->
        <div class="nav-arrow left" @click="prevRelic" v-if="currentIndex > 0">
            ←
        </div>

        <!-- 遗物详情 -->
        <div class="content">
            <div class="header">
                <span class="relic-name">{{ currentRelic.label }}</span>
                <span class="relic-rarity" v-if="currentRelic.rarity">[{{ getRarityText(currentRelic.rarity) }}]</span>
                <span class="ability-badge" v-if="hasActiveAbilities(currentRelic)">⚡ 主动</span>
            </div>

            <div class="body">
                <div class="relic-description">
                    {{ getDescribe(currentRelic.describe, currentRelic) }}
                </div>

                <div class="relic-abilities" v-if="hasActiveAbilities(currentRelic)">
                    <div class="abilities-title">主动能力：</div>
                    <div v-for="(ability, index) in currentRelic.activeAbilities" :key="index" class="ability-item">
                        <div class="ability-label">{{ ability.label }}</div>
                        <div class="ability-desc">{{ getDescribe(ability.describe, currentRelic) }}</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="index-indicator">{{ currentIndex + 1 }} / {{ relics.length }}</div>
                <div class="close" @click="closePopUp(popUp)">关闭</div>
            </div>
        </div>

        <!-- 右箭头 -->
        <div class="nav-arrow right" @click="nextRelic" v-if="currentIndex < relics.length - 1">
            →
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import type { Relic } from '@/core/objects/item/Subclass/Relic'
    import { closePopUp } from '@/ui/hooks/global/popUp'
    import type { PopUp } from '@/ui/hooks/global/popUp'
    import Mask from '@/ui/components/global/Mask.vue'
    import { getDescribe } from '@/ui/hooks/express/describe'
    import { ref, computed } from 'vue'

    const { popUp, props } = defineProps<{
        popUp: PopUp
        props: { relics: Relic[], initialIndex: number }
    }>()
    const { relics, initialIndex } = props

    const currentIndex = ref(initialIndex)
    const currentRelic = computed(() => relics[currentIndex.value])

    function getRarityText(rarity: string): string {
        const rarityMap: Record<string, string> = {
            'common': '普通',
            'uncommon': '稀有',
            'rare': '史诗'
        }
        return rarityMap[rarity] || rarity
    }

    function hasActiveAbilities(relic: Relic): boolean {
        return !!(relic.activeAbilities && relic.activeAbilities.length > 0)
    }

    function prevRelic() {
        if (currentIndex.value > 0) {
            currentIndex.value--
        }
    }

    function nextRelic() {
        if (currentIndex.value < relics.length - 1) {
            currentIndex.value++
        }
    }
</script>

<style scoped lang='scss'>
.relic-detail {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .container {
        display: flex;
        align-items: center;
        gap: 16px;
        position: relative;
        z-index: 1;
    }

    .nav-arrow {
        width: 40px;
        height: 40px;
        border: 2px solid black;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        flex-shrink: 0;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }
    }

    .content {
        background: white;
        border: 2px solid black;
        width: 400px;
        display: flex;
        flex-direction: column;

        .header {
            padding: 12px 16px;
            border-bottom: 2px solid black;
            display: flex;
            align-items: center;
            gap: 8px;

            .relic-name {
                font-weight: bold;
                font-size: 18px;
            }

            .relic-rarity {
                font-size: 13px;
                color: #666;
            }

            .ability-badge {
                margin-left: auto;
                background-color: #3b82f6;
                color: white;
                font-size: 12px;
                padding: 2px 8px;
            }
        }

        .body {
            padding: 16px;

            .relic-description {
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 12px;
            }

            .relic-abilities {
                border-top: 1px solid #ccc;
                padding-top: 12px;

                .abilities-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                .ability-item {
                    margin-bottom: 8px;
                    padding: 8px;
                    border: 1px solid #ccc;
                    background: #f9f9f9;

                    &:last-child { margin-bottom: 0; }

                    .ability-label {
                        font-weight: bold;
                        font-size: 13px;
                        margin-bottom: 4px;
                    }

                    .ability-desc {
                        font-size: 12px;
                        color: #666;
                    }
                }
            }
        }

        .footer {
            padding: 12px 16px;
            border-top: 2px solid black;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .index-indicator {
                font-size: 13px;
                color: #666;
            }

            .close {
                padding: 6px 20px;
                border: 2px solid black;
                cursor: pointer;
                font-weight: bold;

                &:hover {
                    background: rgba(0, 0, 0, 0.05);
                }
            }
        }
    }
}
</style>
