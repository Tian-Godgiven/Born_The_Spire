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

            <!-- 玩家版本卡牌悬浮按钮 -->
            <div
                v-if="playerVersionCard"
                class="player-version-btn"
                @mouseenter="showPlayerVersionCard"
                @mouseleave="hidePlayerVersionCard"
            >
                显示玩家版本
            </div>

            <!-- 卡牌悬停显示 -->
            <Teleport to="body">
                <div
                    v-if="hoveredCard"
                    ref="popoverRef"
                    class="card-popover"
                    :style="popoverStyle"
                >
                    <Card :card="hoveredCard" :hoverTarget="hoverTarget" />
                    <GlossaryPanel :glossaries="hoveredGlossaries" />
                </div>
            </Teleport>
        </div>
    </div>
</Teleport>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getDescribeStructured, getDescribe, type DescribeSegment } from '@/ui/hooks/express/describe'
import { resolveCardFromSegment, createCardFromKey, findCardInstance } from '@/ui/hooks/express/cardSegment'
import { useCardPopover } from '@/ui/hooks/interaction/cardPopover'
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status'
import { getPartLabel } from '@/static/list/target/organPart'
import Card from '@/ui/components/object/Card.vue'
import GlossaryPanel from '@/ui/components/display/GlossaryPanel.vue'
import { entryDefinitions } from '@/core/objects/system/Entry'
import type { Entity } from '@/core/objects/system/Entity'

const props = defineProps({
    organ: { type: Object as PropType<Organ>, required: true },
    visible: { type: Boolean, required: true },
    hoverTarget: { type: Object as PropType<Entity | Entity[]>, required: false }
})

const emit = defineEmits<{
    close: []
}>()

// 卡牌悬停预览
const { hoveredCard, hoveredGlossaries, popoverRef, popoverStyle, showAt, showNear, hide } = useCardPopover()

function close() {
    emit('close')
}

// 获取词条描述
function getEntryDescription(entryKey: string): string {
    const entryDef = entryDefinitions[entryKey]
    if (!entryDef) return '未知词条'
    return getDescribe(entryDef.describe)
}

// 检查器官是否有玩家版本的卡牌
const playerVersionCard = computed(() => {
    if (props.organ.cardsByOwner?.player) {
        return true
    }
    return false
})

// 显示玩家版本卡牌
async function showPlayerVersionCard(event: MouseEvent) {
    if (!props.organ.cardsByOwner?.player) return

    const cardKey = Array.isArray(props.organ.cardsByOwner.player)
        ? props.organ.cardsByOwner.player[0]
        : props.organ.cardsByOwner.player

    const card = await createCardFromKey(cardKey)
    if (!card) return

    await showNear(card, event.currentTarget as HTMLElement)
}

// 隐藏玩家版本卡牌
function hidePlayerVersionCard() {
    hide()
}

// 结构化描述（需要解析卡牌名称）
const describeSegments = computed(() => {
    const segments = getDescribeStructured(props.organ.describe, props.organ)

    // 更新卡牌片段的显示文本
    return segments.map(segment => {
        if (segment.type === 'card' && segment.cardRef) {
            // 如果 describe.ts 已经成功解析出卡牌名称，直接用括号包裹
            if (segment.text && segment.text !== '[卡牌]') {
                return {
                    ...segment,
                    text: `【${segment.text}】`
                }
            }
            // 对于 instance 类型（字符串ID），尝试从牌堆中同步查找
            if (segment.cardRefType === 'instance' && typeof segment.cardRef === 'string') {
                const card = findCardInstance(segment.cardRef, props.organ)
                if (card) {
                    return {
                        ...segment,
                        text: `【${card.label}】`
                    }
                }
            }
            // 兜底：显示占位符
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

async function handleSegmentHover(segment: DescribeSegment, event: MouseEvent) {
    if (segment.type !== 'card') return

    // 异步获取卡牌实例
    const card = await resolveCardFromSegment(segment, props.organ)
    if (!card) return

    await showAt(card, event.clientX, event.clientY)
}

function handleSegmentLeave() {
    hide()
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
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.player-version-btn {
    position: absolute;
    right: -2px;
    top: 50%;
    transform: translate(100%, -50%);
    background: white;
    border: 2px solid black;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    z-index: 10000;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
