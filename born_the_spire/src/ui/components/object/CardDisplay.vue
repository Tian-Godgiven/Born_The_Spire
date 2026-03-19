<template>
<div class="card-display" :class="{ 'temporary': card.isTemporary }">
    <div class="cost" v-if="cost">{{ cost }}</div>
    <div class="title">{{ card.label }}</div>
    <div class="line"></div>

    <!-- 临时标识 -->
    <div class="temporary-indicator" v-if="card.isTemporary">
        临时 ({{ getRemoveOnText() }})
    </div>

    <!-- 词条标签显示 -->
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
</div>
</template>

<script setup lang='ts'>
import type { Card } from '@/core/objects/item/Subclass/Card';
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status';
import { getDescribeStructured, type DescribeSegment } from '@/ui/hooks/express/describe';
import { computed } from 'vue';
import { entryDefinitions } from '@/core/objects/system/Entry';
import { getEntryModifier } from '@/core/objects/system/modifier/EntryModifier';

const { card } = defineProps<{
    card: Card
}>()

// 结构化描述（不需要效果预览）
const describeSegments = computed(() => {
    return getDescribeStructured(card.describe, card)
})

const cost = computed(() => {
    const ifCost = ifHaveStatus(card, "cost")
    if (ifCost) {
        return getStatusValue(card, "cost")
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
    return entryDefinitions[entryKey]?.label || entryKey
}

// 获取片段的CSS类
function getSegmentClass(segment: DescribeSegment): string {
    if (segment.type === 'glossary') {
        return 'glossary-term'
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
</script>

<style scoped lang='scss'>
.card-display {
    background-color: white;
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

    .cost {
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

    .title {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
    }

    .line {
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

    .describe {
        padding: 0 5px;
        overflow-y: auto;

        .glossary-term {
            text-decoration: underline;
            font-weight: bold;
        }
    }
}
</style>
