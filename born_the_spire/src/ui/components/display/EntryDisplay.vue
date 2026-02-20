<template>
<div class="entry-display-container">
    <!-- 词条详情弹窗 -->
    <div
        v-if="hasEntries"
        class="entry-popover"
        :class="side"
    >
        <div class="popover-content">
            <div v-for="entryKey in entries" :key="entryKey" class="entry-item">
                <div class="entry-label">{{ getEntryLabel(entryKey) }}</div>
                <div class="entry-description">
                    {{ getEntryDescription(entryKey) }}
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { entryMap } from '@/static/list/system/entryMap'
import { getDescribe } from '@/ui/hooks/express/describe'

const props = defineProps<{
    entries: string[]  // 词条 key 数组
    side: 'left' | 'right'  // 显示在左侧还是右侧
}>()

// 是否有词条
const hasEntries = computed(() => {
    return props.entries && props.entries.length > 0
})

// 获取词条标签名（中文名称）
function getEntryLabel(entryKey: string): string {
    const entry = entryMap[entryKey]
    return entry?.label || entryKey
}

// 获取词条描述
function getEntryDescription(entryKey: string): string {
    const entry = entryMap[entryKey]
    if (!entry) return ''

    // 使用 getDescribe 处理 Describe 类型
    return getDescribe(entry.describe,entry)
}
</script>

<style scoped lang="scss">
.entry-display-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;  // 不阻止鼠标事件
}

.entry-popover {
    position: absolute;
    top: 0;

    min-width: 150px;
    max-width: 220px;
    z-index: 1000;
    pointer-events: auto;  // 弹窗本身可以接收事件

    &.left {
        left: 0;
        transform: translateX(calc(-100% - 8px));  // 向左移动自身宽度+间距
    }

    &.right {
        right: 0;
        transform: translateX(calc(100% + 8px));  // 向右移动自身宽度+间距
    }

    .popover-header {
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 2px solid black;
        font-size: 14px;
    }

    .popover-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        .entry-item {
            background-color: white;
            border: 2px solid black;
            padding: 6px 8px;

            &:not(:last-child) {
                border-bottom: 1px solid #ccc;
            }

            .entry-label {
                font-weight: bold;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .entry-description {
                font-size: 12px;
                color: #333;
                line-height: 1.4;
            }
        }
    }
}
</style>
