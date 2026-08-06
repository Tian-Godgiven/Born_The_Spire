<template>
<!-- 纯展示组件：定位由使用方负责，这样多个浮层能被统一排布成并列的列 -->
<div class="entry-popover" v-if="hasEntries">
    <div class="popover-content">
        <div v-for="entryKey in entries" :key="entryKey" class="entry-item">
            <div class="entry-label">{{ getEntryLabel(entryKey) }}</div>
            <div class="entry-description">
                {{ getEntryDescription(entryKey) }}
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { entryDefinitions } from '@/core/objects/system/Entry'
import { getDescribe } from '@/ui/hooks/express/describe'

const props = defineProps<{
    entries: string[]  // 词条 key 数组
}>()

// 是否有词条
const hasEntries = computed(() => {
    return props.entries && props.entries.length > 0
})

// 获取词条标签名（中文名称）
function getEntryLabel(entryKey: string): string {
    const entry = entryDefinitions[entryKey]
    return entry?.label || entryKey
}

// 获取词条描述
function getEntryDescription(entryKey: string): string {
    const entry = entryDefinitions[entryKey]
    if (!entry) return ''

    // 使用 getDescribe 处理 Describe 类型
    return getDescribe(entry.describe,entry)
}
</script>

<style scoped lang="scss">
.entry-popover {
    min-width: 150px;
    max-width: 220px;
    box-sizing: border-box;

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
