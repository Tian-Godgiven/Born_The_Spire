<template>
<Teleport to="body">
    <div v-if="visible" class="organ-detail-overlay" @click="close">
        <div class="organ-detail-modal" @click.stop>
            <!-- 关闭按钮 -->
            <button class="close-btn" @click="close">×</button>

            <!-- 标题栏 -->
            <div class="header">
                <div class="title-row">
                    <span class="organ-name">{{ organ.label }}</span>
                    <span class="quality" v-if="hasQuality">质量：{{ currentMass }}/{{ maxMass }}</span>
                </div>
                <div class="info-row">
                    <span v-if="organ.level">Lv.{{ organ.level }}</span>
                    <span v-if="organ.part" class="part">[部位：{{ getPartLabel(organ.part) }}]</span>
                </div>
            </div>

            <div class="divider"></div>

            <!-- 词条区域 -->
            <div v-if="organ.entry.length > 0" class="entries">
                <div v-for="entryKey in organ.entry" :key="entryKey" class="entry-item">
                    <span class="entry-label">【{{ entryKey }}】</span>
                    <span class="entry-desc">{{ getEntryDescription(entryKey) }}</span>
                </div>
            </div>

            <div v-if="organ.entry.length > 0" class="divider"></div>

            <!-- 描述区域（可滚动） -->
            <div class="content">
                <DescribeText
                    :describe="organ.describe"
                    :target="organ"
                    bracket-cards
                    :hoverTarget="hoverTarget"
                    :extra-glossaries="organ.entry"
                />
                <div class="organ-flavor" v-if="getFlavorDescribe(organ).length > 0">
                    <DescribeText
                        :describe="getFlavorDescribe(organ)"
                        :target="organ"
                        glossary-disabled
                    />
                </div>
            </div>

            <!-- 器官自身的状态：内部计数标记（损耗、充能、预算等）都挂在器官上 -->
            <StateDisplay class="states" :target="organ" embedded />

            <!-- 玩家版本卡牌悬浮按钮 -->
            <div class="player-version-anchor" v-if="hasPlayerVersion">
                <Popover placement="bottom" @update:show="handlePlayerVersionShow">
                    <div class="player-version-btn">显示玩家版本</div>

                    <template #content>
                        <Card v-if="playerCard" :card="playerCard" :hoverTarget="hoverTarget" />
                    </template>
                </Popover>
            </div>
        </div>
    </div>
</Teleport>
</template>

<script setup lang="ts">
import { computed, shallowRef, markRaw, type PropType } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getDescribe, getFlavorDescribe } from '@/ui/hooks/express/describe'
import { createCardFromKey } from '@/ui/hooks/express/cardSegment'
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status'
import { getPartLabel } from '@/static/list/target/organPart'
import Card from '@/ui/components/object/Card.vue'
import DescribeText from '@/ui/components/display/DescribeText.vue'
import StateDisplay from '@/ui/components/display/StateDisplay.vue'
import Popover from '@/ui/components/global/Popover.vue'
import { entryDefinitions } from '@/core/objects/system/Entry'
import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
import type { Entity } from '@/core/objects/system/Entity'

const props = defineProps({
    organ: { type: Object as PropType<Organ>, required: true },
    visible: { type: Boolean, required: true },
    hoverTarget: { type: Object as PropType<Entity | Entity[]>, required: false }
})

const emit = defineEmits<{
    close: []
}>()

function close() {
    emit('close')
}

// 获取词条描述
function getEntryDescription(entryKey: string): string {
    const entryDef = entryDefinitions[entryKey]
    if (!entryDef) return '未知词条'
    return getDescribe(entryDef.describe)
}

// 玩家版本卡牌：同一器官装在玩家身上时提供的另一张牌，悬停按钮时才建实例
const hasPlayerVersion = computed(() => !!props.organ.cardsByOwner?.player)

const playerCard = shallowRef<CardType | null>(null)

async function handlePlayerVersionShow(shown: boolean) {
    if (!shown || playerCard.value) return

    const playerCards = props.organ.cardsByOwner?.player
    if (!playerCards) return

    const cardKey = Array.isArray(playerCards) ? playerCards[0] : playerCards
    const card = await createCardFromKey(cardKey)
    if (card) playerCard.value = markRaw(card)
}

// 质量信息
const hasQuality = computed(() => {
    return ifHaveStatus(props.organ, "max-mass")
})

const maxMass = computed(() => {
    if (!hasQuality.value) return 0
    return getStatusValue(props.organ, "max-mass")
})

const currentMass = computed(() => {
    return props.organ.current.mass?.value || 0
})

</script>

<style scoped lang="scss">
.organ-detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.organ-detail-modal {
    position: relative;
    background: white;
    border: 2px solid black;
    width: 450px;
    max-height: 600px;
    display: flex;
    flex-direction: column;
}

.close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 24px;
    height: 24px;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.header {
    padding: 16px 40px 16px 16px;

    .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .organ-name {
            font-size: 20px;
            font-weight: bold;
        }

        .quality {
            font-size: 14px;
            color: #666;
        }
    }

    .info-row {
        display: flex;
        gap: 8px;
        font-size: 14px;
        color: #666;

        .part {
            color: #333;
        }
    }
}

.divider {
    height: 1px;
    background: black;
    margin: 0 16px;
}

.content {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    line-height: 1.6;
}

.organ-flavor {
    border-top: 1px solid #ccc;
    margin-top: 12px;
    padding-top: 12px;
    color: #666;
    font-size: 13px;
}

.entries {
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.02);

    .entry-item {
        margin-bottom: 8px;
        line-height: 1.5;

        &:last-child {
            margin-bottom: 0;
        }

        .entry-label {
            font-weight: bold;
            margin-right: 4px;
        }

        .entry-desc {
            color: #555;
        }
    }
}

// 定位交给外层容器，按钮本身保持静态，免得和 Popover 触发区的 position: relative 打架
.states {
    margin: 0 16px 16px;
}

.player-version-anchor {
    position: absolute;
    right: -2px;
    top: 50%;
    transform: translate(100%, -50%);
}

.player-version-btn {
    background: white;
    border: 2px solid black;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
