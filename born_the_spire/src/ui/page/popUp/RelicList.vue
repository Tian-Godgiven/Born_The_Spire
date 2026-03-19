<template>
<div class="relic-list">
    <Mask></Mask>
    <div class="container">
        <div class="header">
            <div class="title">遗物列表</div>
            <div class="count">共 {{ relics.length }} 个遗物</div>
        </div>
        <div class="relics">
            <div v-for="relic in relics" :key="relic.key" class="relic-item">
                <div class="relic-header">
                    <span class="relic-name">{{ relic.label }}</span>
                    <span class="relic-rarity" v-if="relic.rarity">[{{ getRarityText(relic.rarity) }}]</span>
                    <span class="ability-badge" v-if="hasActiveAbilities(relic)">⚡</span>
                </div>
                <div class="relic-description">
                    {{ getDescribe(relic.describe, relic) }}
                </div>
                <div class="relic-abilities" v-if="hasActiveAbilities(relic)">
                    <div class="abilities-title">主动能力：</div>
                    <div v-for="(ability, index) in relic.activeAbilities" :key="index" class="ability-item">
                        <span class="ability-label">{{ ability.label }}</span>
                        <span class="ability-desc">- {{ getDescribe(ability.describe, relic) }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="close" @click="closePopUp(popUp)">关闭</div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import type { Relic } from '@/core/objects/item/Subclass/Relic'
    import { closePopUp } from '@/ui/hooks/global/popUp'
    import type { PopUp } from '@/ui/hooks/global/popUp'
    import Mask from '@/ui/components/global/Mask.vue'
    import { getDescribe } from '@/ui/hooks/express/describe'

    const { popUp, props } = defineProps<{
        popUp: PopUp
        props: { relics: Relic[] }
    }>()
    const { relics } = props

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
</script>

<style scoped lang='scss'>
.relic-list {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .container {
        background: white;
        border: 2px solid black;
        padding: 20px;
        width: 70%;
        max-height: 80%;
        display: flex;
        flex-direction: column;
        position: relative;

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid black;

            .title {
                font-size: 20px;
                font-weight: bold;
            }

            .count {
                font-size: 14px;
                color: #666;
            }
        }

        .relics {
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            align-content: flex-start;

            .relic-item {
                border: 2px solid black;
                padding: 12px;
                background: white;

                .relic-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #ccc;

                    .relic-name {
                        font-weight: bold;
                        font-size: 16px;
                    }

                    .relic-rarity {
                        font-size: 12px;
                        color: #666;
                    }

                    .ability-badge {
                        margin-left: auto;
                        background-color: #3b82f6;
                        color: white;
                        font-size: 12px;
                        padding: 2px 6px;
                        border-radius: 4px;
                    }
                }

                .relic-description {
                    font-size: 13px;
                    line-height: 1.5;
                    margin-bottom: 8px;
                    color: #333;
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
                        margin-bottom: 4px;
                        font-size: 12px;
                        padding: 4px 6px;
                        background: #f9f9f9;
                        border: 1px solid #e0e0e0;

                        &:last-child {
                            margin-bottom: 0;
                        }

                        .ability-label {
                            font-weight: bold;
                        }

                        .ability-desc {
                            color: #666;
                        }
                    }
                }
            }
        }

        .close {
            width: 100px;
            height: 50px;
            background-color: white;
            border: 2px solid black;
            position: absolute;
            right: 20px;
            bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-weight: bold;

            &:hover {
                background: rgba(0, 0, 0, 0.05);
            }
        }
    }
}
</style>
