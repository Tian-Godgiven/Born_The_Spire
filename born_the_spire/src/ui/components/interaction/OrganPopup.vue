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
        <DescribeText :describe="organ.describe" :target="organ" />
    </div>

    <!-- 器官自身的状态：内部计数标记（损耗、充能、预算等）都挂在器官上 -->
    <StateDisplay class="popup-states" :target="organ" embedded />
</div>
</template>

<script setup lang="ts">
import { Organ } from '@/core/objects/target/Organ'
import DescribeText from '@/ui/components/display/DescribeText.vue'
import StateDisplay from '@/ui/components/display/StateDisplay.vue'
import { entryDefinitions } from '@/core/objects/system/Entry'

defineProps<{
    organ: Organ
}>()

// 获取词条 label —— 走 entryDefinitions 合并表，避免硬编码字典与词条系统脱节
function getEntryLabel(entryKey: string): string {
    return entryDefinitions[entryKey]?.label || entryKey
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
    }

    .popup-states {
        margin-top: 8px;
    }
}
</style>
