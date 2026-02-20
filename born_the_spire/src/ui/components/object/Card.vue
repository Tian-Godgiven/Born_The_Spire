<template>
<div class="card" ref="card">
    <div class="cost" v-if="cost">{{ cost }}</div>
    <div class="title">{{ card.label }}</div>
    <div class="line"></div>

    <!-- 词条标签显示 -->
    <div class="entry-tags" v-if="entries.length > 0">
        <Popover
            v-for="entryKey in entries"
            :key="entryKey"
            :placement="side === 'left' ? 'left' : 'right'"
        >
            <template #trigger="{ open, close }">
                <span
                    class="entry-tag"
                    @mouseenter="open"
                    @mouseleave="close"
                >
                    [{{ getEntryLabel(entryKey) }}]
                </span>
            </template>
            <div class="entry-detail">
                <div class="entry-name">{{ getEntryLabel(entryKey) }}</div>
                <div class="entry-desc">{{ getEntryDescription(entryKey) }}</div>
            </div>
        </Popover>
    </div>

    <div class="describe">{{ describe }}</div>
</div>
</template>

<script setup lang='ts'>
import { Card } from '@/core/objects/item/Subclass/Card';
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status';
import { getDescribe } from '@/ui/hooks/express/describe';
import { computed } from 'vue';
import { entryMap } from '@/static/list/system/entryMap';
import Popover from '@/ui/components/global/Popover.vue';
import { getEntryModifier } from '@/core/objects/system/modifier/EntryModifier';

const {card, side} = defineProps<{
    card: Card
    side?: 'left' | 'right'  // 可选，默认右侧
}>()

const describe = computed(()=>{
    return getDescribe(card.describe,card)
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

// 获取词条描述
function getEntryDescription(entryKey: string): string {
    const entry = entryMap[entryKey]
    if (!entry) return ''
    return getDescribe(entry.describe)
}

</script>

<style scoped lang='scss'>
.card{
    background-color:white;
    position: relative;
    flex-shrink: 0;
    width: 130px;
    height: 200px;
    border: 2px solid rgb(38, 38, 38);
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
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
                color: black;
                font-weight: bold;
            }
        }
    }
    .describe{
        padding:0 5px;
        overflow-y: auto;
    }
}

.entry-detail {
    min-width: 150px;
    max-width: 220px;

    .entry-name {
        font-weight: bold;
        font-size: 13px;
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px solid #ccc;
    }

    .entry-desc {
        font-size: 12px;
        line-height: 1.4;
        color: #333;
    }
}
</style>