<template>
<Popover
    inline
    :placement="placement"
    :align="align"
    :anchor="anchor"
    :close-delay="300"
    @update:show="handleShow"
>
    <span class="card-term" @click.stop="openDetail">{{ label }}</span>

    <template #content>
        <Card v-if="card" :card="card" :hoverTarget="hoverTarget" />
    </template>
</Popover>
</template>

<script setup lang='ts'>
    import { computed, shallowRef, markRaw } from 'vue'
    import Popover from '@/ui/components/global/Popover.vue'
    import Card from '@/ui/components/object/Card.vue'
    import { resolveCardFromSegment } from '@/ui/hooks/express/cardSegment'
    import { showCardDetail } from '@/ui/hooks/interaction/cardDetail'
    import type { DescribeSegment } from '@/ui/hooks/express/describe'
    import type { Organ } from '@/core/objects/target/Organ'
    import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
    import type { Entity } from '@/core/objects/system/Entity'

    /**
     * 描述文本里的卡牌引用
     *
     * 一段可悬停的卡名，悬停时展开完整卡面。术语板跟手牌一样，要再悬停那张卡才会出。
     * 点击打开详情弹窗，可对照锻造前后。
     * 卡牌实例在首次悬停或点击时才解析，描述里写了多少张牌都不会在渲染时就把它们全建出来。
     */
    const {
        segment,
        text,
        organ,
        hoverTarget,
        preferPlayerCards = false,
        anchor = null,
        placement = "bottom",
        align = "trigger"
    } = defineProps<{
        segment: DescribeSegment,
        /** 覆盖显示文本，不传就用片段自带的 */
        text?: string,
        /** 卡牌引用按索引/实例 ID 解析时要用的器官上下文 */
        organ?: Organ,
        /** 传给卡面做数值预览的目标 */
        hoverTarget?: Entity | Entity[],
        /** 器官同时有敌人版和玩家版卡牌时，优先预览玩家版（奖励界面用） */
        preferPlayerCards?: boolean,
        /**
         * 卡面贴在这块的外边缘，不要用外层浮层整块（介绍+状态并排时那块比介绍框高）。
         * DescribeText 把术语板锚点传过来：器官介绍框 / 卡面本身。
         */
        anchor?: HTMLElement | null,
        placement?: "left" | "right" | "top" | "bottom",
        align?: "start" | "center" | "trigger" | number
    }>()

    const card = shallowRef<CardType | null>(null)

    const label = computed(() => text ?? segment.text)

    async function resolveCard() {
        if (card.value) return card.value
        const resolved = await resolveCardFromSegment(segment, organ, { preferPlayerCards })
        if (resolved) card.value = markRaw(resolved)
        return card.value
    }

    async function handleShow(shown: boolean) {
        if (!shown) return
        await resolveCard()
    }

    async function openDetail() {
        const resolved = await resolveCard()
        if (resolved) showCardDetail(resolved)
    }
</script>

<style scoped lang='scss'>
.card-term {
    color: #2563eb;
    font-weight: bold;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
        color: #1d4ed8;
    }
}
</style>
