<template>
<div class="card" ref="cardRef" :class="{ 'temporary': card.isTemporary, 'disabled': card.isDisabled }">
    <div class="cost" v-if="cost !== null">{{ cost }}</div>
    <div class="title">{{ card.displayName }}</div>
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

    <!-- 术语板绑在 DescribeText 上；锚点是整张卡，词条走 extraGlossaries -->
    <div class="describe">
        <DescribeText
            :describe="describeToShow"
            :target="enhancedCard"
            :glossary-anchor="cardRef"
            glossary-placement="right"
            glossary-align="trigger"
            :extra-glossaries="entries"
            :glossary-disabled="card.isDisabled"
        />
    </div>
</div>
</template>

<script setup lang='ts'>
import type { Card } from '@/core/objects/item/Subclass/Card';
import type { Entity } from '@/core/objects/system/Entity';
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status';
import DescribeText from '@/ui/components/display/DescribeText.vue';
import { computed, ref, type PropType } from 'vue';
import { entryDefinitions } from '@/core/objects/system/Entry';
import { getEntryModifier } from '@/core/objects/system/modifier/EntryModifier';
import { nowPlayer } from '@/core/objects/game/run';
import { previewCardEffects } from '@/core/utils/effectPreview';
import { getTemporaryEffectDescribe } from '@/core/effects/card/addTemporaryEffect';

const {card, side, hoverTarget} = defineProps({
    card: { type: Object as PropType<Card>, required: true },
    side: { type: String as PropType<'left' | 'right'>, required: false },
    hoverTarget: { type: Object as PropType<Entity | Entity[] | undefined>, required: false }
})

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

// 卡牌描述 + 临时效果描述
const describeToShow = computed(() => {
    const tempDescribe = getTemporaryEffectDescribe(card)
    return tempDescribe.length > 0
        ? [...card.describe, ...tempDescribe]
        : card.describe
})

// null 有两种来源，都表示"这张牌没有费用概念"，费用框整个不画：
// 卡牌数据里显式写 cost: null（无费用的诅咒/状态牌），或者压根没定义 cost 属性。
// 注意不能用真值判断，否则 0 费牌会被当成无费用
const cost = computed<number|string|null>(()=>{
    if(!ifHaveStatus(card,"cost")){
        return null
    }
    return getStatusValue(card,"cost") ?? null
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

// 术语浮层的触发区就是卡牌根元素，交给 Popover 挂监听
const cardRef = ref<HTMLElement>()

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

    // 禁用卡牌样式
    &.disabled {
        filter: grayscale(100%);
        opacity: 0.6;
        cursor: not-allowed;
    }

    .cost{
        font-size: 15px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid black;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        position: absolute;
        left: -7px;
        top: -7px;
        background-color: white;
    }
    // 费用圆圈右边缘落在 x=19，左右各留 20px 才能保持标题在整卡居中且不被压住。
    // 剩余 90px 够放 5 个 18px 汉字；更长的卡名截断，绝不换行也绝不压到费用上
    .title{
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        padding: 0 20px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        white-space: normal;
        overflow-wrap: anywhere;
        padding: 0 5px;
        overflow-x: hidden;
        overflow-y: auto;
    }
}

</style>