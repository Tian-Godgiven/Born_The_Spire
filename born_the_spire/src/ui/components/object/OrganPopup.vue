<template>
    <div class="organ-popup">
        <div class="popup-header">
            <span class="popup-organ-name">{{ organ.label }}</span>
            <span class="popup-rarity">{{ getRarityLabel(organ.rarity) }}</span>
        </div>

        <!-- 词条区域 -->
        <div v-if="organ.entry && organ.entry.length > 0" class="popup-entries">
            <div v-for="entryKey in organ.entry" :key="entryKey" class="entry-item">
                <span class="entry-label">【{{ getEntryLabel(entryKey) }}】</span>
            </div>
        </div>

        <div v-if="organ.entry && organ.entry.length > 0" class="popup-divider"></div>

        <div class="popup-content">
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
    </div>

    <!-- 卡牌悬停显示 - 不使用 Teleport，直接渲染 -->
    <div
        v-if="hoveredCard"
        ref="cardPopoverRef"
        class="card-popover"
        :style="cardPopoverStyle"
        @mouseenter="keepCardVisible"
        @mouseleave="handleCardLeave"
    >
        <Card :card="hoveredCard" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getDescribeStructured, type DescribeSegment } from '@/ui/hooks/express/describe'
import Card from '@/ui/components/object/Card.vue'
import type { Card as CardType } from '@/core/objects/item/Subclass/Card'

const props = defineProps<{
    organ: Organ
}>()

// 卡牌悬停状态
const hoveredCard = ref<CardType | null>(null)
const cardPopoverRef = ref<HTMLElement>()
const cardPopoverStyle = ref<Record<string, string>>({})
let mouseX = 0
let mouseY = 0
let hideCardTimeout: NodeJS.Timeout | null = null

// 词条 label 映射
const entryLabelMap: Record<string, string> = {
    'organ_fragile': '脆弱',
    'organ_sturdy': '坚固',
    'organ_regenerative': '再生',
    'card_ethereal': '虚无',
    'card_exhaust': '消耗',
    'card_innate': '固有',
    'card_retain': '保留'
}

// 获取词条 label
function getEntryLabel(entryKey: string): string {
    return entryLabelMap[entryKey] || entryKey
}

// 获取稀有度标签
function getRarityLabel(rarity: string): string {
    const rarityMap: Record<string, string> = {
        'common': '普通',
        'uncommon': '罕见',
        'rare': '稀有',
        'epic': '史诗',
        'legendary': '传说'
    }
    return rarityMap[rarity] || rarity
}

// 获取器官描述的结构化片段
const describeSegments = computed(() => {
    return getDescribeStructured(props.organ.describe, props.organ)
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

// 卡牌获取函数 - 总是通过 key 创建
async function getCardFromSegment(segment: DescribeSegment): Promise<CardType | null> {
    if (segment.cardRef === undefined || segment.cardRef === null) {
        return null
    }

    let cardKey: string | null = null

    if (segment.cardRefType === 'instance') {
        // 索引类型 - 从器官的 cards 数组获取 cardKey
        if (typeof segment.cardRef === 'number') {
            const index = segment.cardRef
            const cardsArray = props.organ.cards
            if (index >= 0 && index < cardsArray.length) {
                cardKey = cardsArray[index]
            }
        }
    } else if (segment.cardRefType === 'key') {
        // 直接是 key
        cardKey = segment.cardRef as string
    }

    if (!cardKey) {
        return null
    }

    // 通过 key 创建临时卡牌实例
    return await createCardFromKey(cardKey)
}

async function createCardFromKey(cardKey: string): Promise<CardType | null> {
    try {
        const { getLazyModule } = await import('@/core/utils/lazyLoader')
        const cardList = getLazyModule<any[]>('cardList')
        const cardData = cardList.find((c: any) => c.key === cardKey)
        if (!cardData) {
            return null
        }

        const { Card } = await import('@/core/objects/item/Subclass/Card')
        return new Card(cardData)
    } catch (error) {
        console.error('[OrganPopup] 创建临时卡牌失败:', error)
        return null
    }
}

// 卡牌悬停处理
async function handleSegmentHover(segment: DescribeSegment, event: MouseEvent) {
    if (segment.type !== 'card') return

    // 清除隐藏定时器
    if (hideCardTimeout) {
        clearTimeout(hideCardTimeout)
        hideCardTimeout = null
    }

    // 保存鼠标位置（使用普通变量，避免响应式包装）
    mouseX = event.clientX
    mouseY = event.clientY

    const card = await getCardFromSegment(segment)
    if (!card) return

    hoveredCard.value = card

    nextTick(() => {
        updateCardPopoverPosition()
    })
}

function handleSegmentLeave() {
    // 延迟隐藏，给用户时间移动到卡牌上
    hideCardTimeout = setTimeout(() => {
        hoveredCard.value = null
    }, 200)
}

function keepCardVisible() {
    // 鼠标移到卡牌上时，取消隐藏
    if (hideCardTimeout) {
        clearTimeout(hideCardTimeout)
        hideCardTimeout = null
    }
}

function handleCardLeave() {
    // 鼠标离开卡牌时，立即隐藏
    hoveredCard.value = null
}

function updateCardPopoverPosition() {
    if (!cardPopoverRef.value) return

    const popoverRect = cardPopoverRef.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    let left = 0
    let top = 0

    // 优先级：右侧 > 左侧 > 下侧 > 上侧

    // 尝试右侧
    if (mouseX + padding + popoverRect.width <= viewportWidth) {
        left = mouseX + padding
        top = mouseY
    }
    // 尝试左侧
    else if (mouseX - padding - popoverRect.width >= 0) {
        left = mouseX - padding - popoverRect.width
        top = mouseY
    }
    // 尝试下侧
    else if (mouseY + padding + popoverRect.height <= viewportHeight) {
        left = mouseX
        top = mouseY + padding
    }
    // 尝试上侧
    else if (mouseY - padding - popoverRect.height >= 0) {
        left = mouseX
        top = mouseY - padding - popoverRect.height
    }
    // 都不行，强制显示在右侧
    else {
        left = mouseX + padding
        top = mouseY
    }

    // 垂直方向边界检查（对于左右侧显示）
    if (top + popoverRect.height > viewportHeight) {
        top = viewportHeight - popoverRect.height - padding
    }
    if (top < padding) {
        top = padding
    }

    // 水平方向边界检查（对于上下侧显示）
    if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - padding
    }
    if (left < padding) {
        left = padding
    }

    cardPopoverStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: '10001'
    }
}
</script>

<style scoped lang='scss'>
.organ-popup {
    background: white;
    border: 2px solid black;
    padding: 12px;
    width: 270px;
    box-sizing: border-box;

    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .popup-organ-name {
            font-size: 16px;
            font-weight: bold;
        }

        .popup-rarity {
            font-size: 12px;
            color: #666;
        }
    }

    .popup-entries {
        margin-bottom: 8px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.02);

        .entry-item {
            margin-bottom: 6px;
            line-height: 1.5;

            &:last-child {
                margin-bottom: 0;
            }

            .entry-label {
                font-weight: bold;
                margin-right: 4px;
            }
        }
    }

    .popup-divider {
        height: 1px;
        background: black;
        margin-bottom: 8px;
    }

    .popup-content {
        line-height: 1.6;
        font-size: 14px;
        word-wrap: break-word;
        white-space: normal;

        .glossary-term {
            text-decoration: underline;
            font-weight: bold;
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
}

.card-popover {
    pointer-events: auto;
    width: fit-content;
}
</style>
