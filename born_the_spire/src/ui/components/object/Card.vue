<template>
<div class="card" ref="cardRef" :class="{ 'temporary': card.isTemporary }">
    <div class="cost" v-if="cost">{{ cost }}</div>
    <div class="title">{{ card.label }}</div>
    <div class="line"></div>

    <!-- 临时标识 -->
    <div class="temporary-indicator" v-if="card.isTemporary">
        临时 ({{ getRemoveOnText() }})
    </div>

    <!-- 词条标签显示（无Popover） -->
    <div class="entry-tags" v-if="entries.length > 0">
        <span
            v-for="entryKey in entries"
            :key="entryKey"
            class="entry-tag"
        >
            [{{ getEntryLabel(entryKey) }}]
        </span>
    </div>

    <!-- 结构化描述渲染 -->
    <div class="describe">
        <span
            v-for="(segment, index) in describeSegments"
            :key="index"
            :class="getSegmentClass(segment)"
            :style="getSegmentStyle(segment)"
        >
            {{ segment.text }}
        </span>
    </div>

    <!-- 整卡Tooltip -->
    <Teleport to="body">
        <div
            v-if="showTooltip"
            ref="tooltipRef"
            class="card-tooltip"
            :style="tooltipStyle"
        >
            <div
                v-for="glossaryKey in allGlossaries"
                :key="glossaryKey"
                class="tooltip-item"
            >
                <div class="tooltip-term">{{ getGlossaryLabel(glossaryKey) }}</div>
                <div class="tooltip-desc">{{ getGlossaryDescription(glossaryKey) }}</div>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script setup lang='ts'>
import type { Card } from '@/core/objects/item/Subclass/Card';
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status';
import { getDescribe, getDescribeStructured, extractGlossaries, type DescribeSegment } from '@/ui/hooks/express/describe';
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { entryMap } from '@/static/list/system/entryMap';
import { glossaryMap } from '@/static/list/system/glossaryMap';
import { getEntryModifier } from '@/core/objects/system/modifier/EntryModifier';
import { nowPlayer } from '@/core/objects/game/run';
import { previewCardEffects } from '@/core/utils/effectPreview';

const {card, side, hoverTarget} = defineProps<{
    card: Card
    side?: 'left' | 'right'  // 可选，默认右侧
    hoverTarget?: any  // 可选，鼠标悬停的目标
}>()

// 预览卡牌效果
const previewResult = computed(() => {
    return previewCardEffects(card, nowPlayer, hoverTarget)
})

// 创建一个增强的卡牌对象，用于动态显示效果值
const enhancedCard = computed(() => {
    return new Proxy(card, {
        get(target, prop) {
            if (prop === 'status') {
                return new Proxy(target.status, {
                    get(statusTarget, statusProp) {
                        const originalValue = statusTarget[statusProp as string]

                        // 如果是 Status 对象，返回一个代理
                        if (originalValue && typeof originalValue === 'object' && 'value' in originalValue) {
                            return new Proxy(originalValue, {
                                get(statusObj, valueProp) {
                                    // 如果访问的是 value 属性，返回预览计算的值
                                    if (valueProp === 'value') {
                                        const effectType = statusProp as string
                                        // 如果预览结果中有这个效果，使用预览值
                                        if (previewResult.value[effectType] !== undefined) {
                                            return previewResult.value[effectType]
                                        }
                                        // 否则返回原始值
                                        return (statusObj as any)[valueProp]
                                    }
                                    return (statusObj as any)[valueProp]
                                }
                            })
                        }

                        return originalValue
                    }
                })
            }

            return (target as any)[prop]
        }
    })
})

// 结构化描述
const describeSegments = computed(() => {
    return getDescribeStructured(card.describe, enhancedCard.value)
})

const cost = computed(()=>{
    const ifCost = ifHaveStatus(card,"cost")
    if(ifCost){
        return getStatusValue(card,"cost")
    }
    return false
})

// 从 EntryModifier 获取词条列表
const entries = computed(() => {
    const entryModifier = getEntryModifier(card)
    return entryModifier.getEntries()
})

// 获取词条显示名称
function getEntryLabel(entryKey: string): string {
    return entryMap[entryKey]?.label || entryKey
}

// 获取片段的CSS类
function getSegmentClass(segment: DescribeSegment): string {
    if (segment.type === 'glossary') {
        return 'glossary-term'
    }
    return ''
}

// 获取片段的样式（如果有自定义样式则使用，否则使用默认）
function getSegmentStyle(segment: DescribeSegment): Record<string, string> | undefined {
    if (segment.type === 'glossary' && segment.style) {
        return segment.style
    }
    return undefined
}

// 收集所有需要显示的术语（词条 + describe中的术语）
const allGlossaries = computed(() => {
    const glossaries = new Set<string>()

    // 添加词条
    entries.value.forEach(entryKey => {
        const entryLabel = entryMap[entryKey]?.label
        if (entryLabel && glossaryMap[entryLabel]) {
            glossaries.add(entryLabel)
        }
    })

    // 添加describe中的术语
    const describeGlossaries = extractGlossaries(card.describe)
    describeGlossaries.forEach(key => glossaries.add(key))

    return Array.from(glossaries)
})

// 获取术语标签
function getGlossaryLabel(glossaryKey: string): string {
    return glossaryMap[glossaryKey]?.label || glossaryKey
}

// 获取术语描述
function getGlossaryDescription(glossaryKey: string): string {
    const glossary = glossaryMap[glossaryKey]
    if (!glossary) return ''
    return getDescribe(glossary.describe)
}

// 获取临时移除时机的文本
function getRemoveOnText(): string {
    if (!card.temporaryRemoveOn) return ''

    switch (card.temporaryRemoveOn) {
        case 'battleEnd':
            return '战斗结束时移除'
        case 'turnEnd':
            return '回合结束时移除'
        case 'floorEnd':
            return '层级结束时移除'
        default:
            return '临时'
    }
}

// Tooltip显示控制
const cardRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()
const showTooltip = ref(false)
const tooltipStyle = ref<Record<string, string>>({})

function handleMouseEnter() {
    if (allGlossaries.value.length === 0) return
    showTooltip.value = true
    nextTick(() => {
        updateTooltipPosition()
    })
}

function handleMouseLeave() {
    showTooltip.value = false
}

function updateTooltipPosition() {
    if (!cardRef.value || !tooltipRef.value) return

    const cardRect = cardRef.value.getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()

    // 默认显示在右侧
    let left = cardRect.right + 8
    let top = cardRect.top

    // 边界检查
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 如果右侧空间不足，显示在左侧
    if (left + tooltipRect.width > viewportWidth) {
        left = cardRect.left - tooltipRect.width - 8
    }

    // 如果左侧也不够，强制显示在右侧但调整位置
    if (left < 0) {
        left = cardRect.right + 8
        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - 8
        }
    }

    // 垂直方向边界检查
    if (top + tooltipRect.height > viewportHeight) {
        top = viewportHeight - tooltipRect.height - 8
    }
    if (top < 0) top = 8

    tooltipStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: '10000'
    }
}

onMounted(() => {
    if (cardRef.value) {
        cardRef.value.addEventListener('mouseenter', handleMouseEnter)
        cardRef.value.addEventListener('mouseleave', handleMouseLeave)
    }
})

onBeforeUnmount(() => {
    if (cardRef.value) {
        cardRef.value.removeEventListener('mouseenter', handleMouseEnter)
        cardRef.value.removeEventListener('mouseleave', handleMouseLeave)
    }
})

</script>

<style scoped lang='scss'>
.card{
    background-color:white;
    position: relative;
    flex-shrink: 0;
    width: 130px;
    height: 200px;
    border: 2px solid rgb(38, 38, 38);

    // 临时卡牌样式
    &.temporary {
        border-style: dashed;
        border-color: #f59e0b;
        background-color: #fffbeb;
    }

    .cost{
        font-size: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid black;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        position: absolute;
        left: -7px;
        top: -7px;
        background-color: white;
    }
    .title{
        text-align: center;
        font-size: 20px;
        font-weight: bold;
    }
    .line{
        box-sizing: border-box;
        margin: 2px 5px;
        height: 1px;
        background-color: black;
    }
    .entry-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 0 5px;
        margin-bottom: 4px;

        .entry-tag {
            display: inline-block;
            font-size: 16px;
            color: #333;
        }
    }

    .temporary-indicator {
        background-color: #f59e0b;
        color: white;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
        font-weight: bold;
        margin: 2px 5px;
        border-radius: 2px;
    }

    .describe{
        padding:0 5px;
        overflow-y: auto;

        .glossary-term {
            text-decoration: underline;
            font-weight: bold;
        }
    }
}

.card-tooltip {
    background: white;
    border: 2px solid black;
    padding: 8px;
    min-width: 150px;
    max-width: 250px;

    .tooltip-item {
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }

        .tooltip-term {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 2px;
        }

        .tooltip-desc {
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
    }
}
</style>