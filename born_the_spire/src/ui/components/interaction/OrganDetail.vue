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
                <span
                    v-for="(segment, index) in describeSegments"
                    :key="index"
                    :class="getSegmentClass(segment)"
                    :style="getSegmentStyle(segment)"
                    @mouseenter="handleSegmentHover(segment, $event)"
                    @mouseleave="handleSegmentLeave"
                >
                    {{ segment.text }}
                </span>
            </div>

            <!-- 卡牌悬停显示 -->
            <Teleport to="body">
                <div
                    v-if="hoveredCard"
                    ref="cardPopoverRef"
                    class="card-popover"
                    :style="cardPopoverStyle"
                >
                    <Card :card="hoveredCard" :hoverTarget="hoverTarget" />
                </div>
            </Teleport>
        </div>
    </div>
</Teleport>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getDescribeStructured, getDescribe, type DescribeSegment } from '@/ui/hooks/express/describe'
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status'
import { getPartLabel } from '@/static/list/target/organPart'
import Card from '@/ui/components/object/Card.vue'
import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
import { nowPlayer } from '@/core/objects/game/run'
import { entryDefinitions } from '@/core/objects/system/Entry'

const props = defineProps<{
    organ: Organ
    visible: boolean
    hoverTarget?: any
}>()

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

// 卡牌获取函数
async function getCardFromSegment(segment: DescribeSegment): Promise<CardType | null> {
    if (!segment.cardRef) return null

    if (segment.cardRefType === 'instance') {
        // 从牌堆中查找实例
        if (typeof segment.cardRef === 'string') {
            return findCardById(segment.cardRef)
        }
        // 索引（不应该出现在运行时）
        console.warn('卡牌索引应该在实例化时被替换为ID')
        return null
    } else if (segment.cardRefType === 'key') {
        // 用key创建临时卡牌实例
        return await createCardFromKey(segment.cardRef as string)
    }

    return null
}

function findCardById(cardId: string): CardType | null {
    // 从玩家的所有牌堆中查找卡牌
    const allCards = [
        ...nowPlayer.cardPiles.handPile,
        ...nowPlayer.cardPiles.drawPile,
        ...nowPlayer.cardPiles.discardPile,
        ...nowPlayer.cardPiles.exhaustPile
    ]
    return allCards.find((card: any) => card.__id === cardId) || null
}

async function createCardFromKey(cardKey: string): Promise<CardType | null> {
    // 使用 lazyLoader 获取 cardList
    try {
        const { getLazyModule } = await import('@/core/utils/lazyLoader')
        const cardList = getLazyModule<any[]>('cardList')
        const cardData = cardList.find((c: any) => c.key === cardKey)
        if (!cardData) return null

        const { createCard } = await import('@/core/factories')
        return await createCard(cardData)
    } catch (error) {
        console.error('创建临时卡牌失败:', error)
        return null
    }
}

// 结构化描述（需要解析卡牌名称）
const describeSegments = computed(() => {
    const segments = getDescribeStructured(props.organ.describe, props.organ)

    // 更新卡牌片段的显示文本（同步处理，只显示占位符）
    return segments.map(segment => {
        if (segment.type === 'card' && segment.cardRef) {
            // 对于 instance 类型，尝试同步查找
            if (segment.cardRefType === 'instance' && typeof segment.cardRef === 'string') {
                const card = findCardById(segment.cardRef)
                if (card) {
                    return {
                        ...segment,
                        text: `【${card.label}】`
                    }
                }
            }
            // 对于 key 类型，显示占位符（实际卡牌在 hover 时异步加载）
            return {
                ...segment,
                text: `【卡牌】`
            }
        }
        return segment
    })
})

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

// 获取片段的CSS类
function getSegmentClass(segment: DescribeSegment): string {
    if (segment.type === 'glossary') {
        return 'glossary-term'
    }
    if (segment.type === 'card') {
        return 'card-term'
    }
    return ''
}

// 获取片段的样式
function getSegmentStyle(segment: DescribeSegment): Record<string, string> | undefined {
    if (segment.type === 'glossary' && segment.style) {
        return segment.style
    }
    return undefined
}

// 卡牌悬停显示
const hoveredCard = ref<CardType | null>(null)
const cardPopoverRef = ref<HTMLElement>()
const cardPopoverStyle = ref<Record<string, string>>({})

async function handleSegmentHover(segment: DescribeSegment, event: MouseEvent) {
    if (segment.type !== 'card') return

    // 异步获取卡牌实例
    const card = await getCardFromSegment(segment)
    if (!card) return

    hoveredCard.value = card

    nextTick(() => {
        updateCardPopoverPosition(event.target as HTMLElement)
    })
}

function handleSegmentLeave() {
    hoveredCard.value = null
}

function updateCardPopoverPosition(triggerElement: HTMLElement) {
    if (!cardPopoverRef.value) return

    const triggerRect = triggerElement.getBoundingClientRect()
    const popoverRect = cardPopoverRef.value.getBoundingClientRect()

    // 默认显示在右侧
    let left = triggerRect.right + 8
    let top = triggerRect.top

    // 边界检查
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 如果右侧空间不足，显示在左侧
    if (left + popoverRect.width > viewportWidth) {
        left = triggerRect.left - popoverRect.width - 8
    }

    // 如果左侧也不够，强制显示在右侧但调整位置
    if (left < 0) {
        left = triggerRect.right + 8
        if (left + popoverRect.width > viewportWidth) {
            left = viewportWidth - popoverRect.width - 8
        }
    }

    // 垂直方向边界检查
    if (top + popoverRect.height > viewportHeight) {
        top = viewportHeight - popoverRect.height - 8
    }
    if (top < 0) top = 8

    cardPopoverStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: '10001'
    }
}
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

    .glossary-term {
        text-decoration: underline;
        font-weight: bold;
        cursor: pointer;
    }

    .card-term {
        color: #2563eb;
        font-weight: bold;
        cursor: pointer;
        text-decoration: underline;

        &:hover {
            color: #1d4ed8;
        }
    }
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

.card-popover {
    background: white;
    border: 2px solid black;
    padding: 4px;
}
</style>
