<template>
    <div class="organ-popup" ref="rootRef">
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

    <!-- 卡牌悬停显示：外层若是浮层就挂进去，否则挂 body，见 usePopoverHost -->
    <Teleport :to="host">
        <div
            v-if="hoveredCard"
            ref="popoverRef"
            class="card-popover"
            :style="popoverStyle"
            @mouseenter="cancelHide"
            @mouseleave="hide()"
        >
            <Card :card="hoveredCard" />
            <GlossaryPanel :glossaries="hoveredGlossaries" />
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getDescribeStructured, type DescribeSegment } from '@/ui/hooks/express/describe'
import { resolveCardFromSegment } from '@/ui/hooks/express/cardSegment'
import { useCardPopover } from '@/ui/hooks/interaction/cardPopover'
import Card from '@/ui/components/object/Card.vue'
import GlossaryPanel from '@/ui/components/display/GlossaryPanel.vue'
import { entryDefinitions } from '@/core/objects/system/Entry'

const props = defineProps<{
    organ: Organ
}>()

// 卡牌悬停预览
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const { hoveredCard, hoveredGlossaries, popoverRef, popoverStyle, host, showAt, hide, cancelHide } = useCardPopover(rootRef)

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

// 卡牌悬停处理
async function handleSegmentHover(segment: DescribeSegment, event: MouseEvent) {
    if (segment.type !== 'card') return

    const card = await resolveCardFromSegment(segment, props.organ)
    if (!card) return

    await showAt(card, event.clientX, event.clientY)
}

function handleSegmentLeave() {
    // 延迟隐藏，给用户时间移动到卡牌上
    hide(200)
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
    display: flex;
    align-items: flex-start;
    gap: 8px;
}
</style>
