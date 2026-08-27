<template>
<span class="describe-text">
    <template v-for="(segment, index) in segments" :key="index">
        <CardRefText
            v-if="segment.type === 'card'"
            :segment="segment"
            :text="getCardText(segment)"
            :organ="organ"
            :hoverTarget="hoverTarget"
            :preferPlayerCards="preferPlayerCards"
        />
        <span
            v-else
            :class="{ 'glossary-term': segment.type === 'glossary' }"
            :style="segment.type === 'glossary' ? segment.style : undefined"
        >{{ segment.text }}</span>
    </template>
</span>
</template>

<script setup lang='ts'>
    import { computed } from 'vue'
    import CardRefText from '@/ui/components/display/CardRefText.vue'
    import { getDescribeStructured, type Describe, type DescribeSegment } from '@/ui/hooks/express/describe'
    import { findCardInstance } from '@/ui/hooks/express/cardSegment'
    import type { Organ } from '@/core/objects/target/Organ'
    import type { Entity } from '@/core/objects/system/Entity'

    /**
     * 结构化描述文本
     *
     * 把 describe 数据渲染成带样式的一段文字：数值就地取值，术语加下划线，
     * 卡牌引用交给 CardRefText 自带悬停预览。凡是要显示 describe 的地方都用它，
     * 不要各自再写一遍 v-for + getDescribeStructured。
     */
    const { describe, target, bracketCards = false, hoverTarget, preferPlayerCards = false } = defineProps<{
        describe?: Describe,
        /** 描述里取值的对象（器官/卡牌/遗物自身） */
        target?: object,
        /** 卡名是否用【】包起来 */
        bracketCards?: boolean,
        /** 传给卡面预览做数值预览的目标 */
        hoverTarget?: Entity | Entity[],
        /** 器官同时有敌人版和玩家版卡牌时，优先预览玩家版（奖励界面用） */
        preferPlayerCards?: boolean
    }>()

    const segments = computed(() => getDescribeStructured(describe, target))

    /**
     * 卡牌索引 / 实例 ID 要靠器官上下文才能解析
     *
     * 认「带卡牌列表」而不是认 targetType：奖励界面拿到的是器官数据表原始对象，
     * 还没实例化成 Organ，但一样有 cards / cardsByOwner
     */
    const organ = computed(() => {
        const value = target as any
        if (!value) return undefined
        return (value.cards || value.cardsByOwner) ? value as Organ : undefined
    })

    function getCardText(segment: DescribeSegment): string | undefined {
        if (!bracketCards) return undefined
        if (segment.text && segment.text !== '[卡牌]') return `【${segment.text}】`

        // describe 阶段没解析出名字，再按实例 ID 去持有者牌堆里找一次
        if (segment.cardRefType === 'instance' && typeof segment.cardRef === 'string') {
            const card = findCardInstance(segment.cardRef, organ.value)
            if (card) return `【${card.label}】`
        }
        return '【卡牌】'
    }
</script>

<style scoped lang='scss'>
.glossary-term {
    text-decoration: underline;
    font-weight: bold;
}
</style>
