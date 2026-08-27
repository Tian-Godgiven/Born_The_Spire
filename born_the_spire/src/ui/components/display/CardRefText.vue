<template>
<Popover inline placement="right" align="trigger" :close-delay="300" @update:show="handleShow">
    <span class="card-term">{{ label }}</span>

    <template #content>
        <div class="card-preview" v-if="card">
            <Card :card="card" :hoverTarget="hoverTarget" />
            <GlossaryPanel :glossaries="glossaries" />
        </div>
    </template>
</Popover>
</template>

<script setup lang='ts'>
    import { computed, shallowRef, markRaw } from 'vue'
    import Popover from '@/ui/components/global/Popover.vue'
    import Card from '@/ui/components/object/Card.vue'
    import GlossaryPanel from '@/ui/components/display/GlossaryPanel.vue'
    import { resolveCardFromSegment } from '@/ui/hooks/express/cardSegment'
    import { getCardGlossaries } from '@/ui/hooks/express/glossary'
    import type { DescribeSegment } from '@/ui/hooks/express/describe'
    import type { Organ } from '@/core/objects/target/Organ'
    import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
    import type { Entity } from '@/core/objects/system/Entity'

    /**
     * 描述文本里的卡牌引用
     *
     * 一段可悬停的卡名，悬停时在旁边展开完整卡面与术语。卡牌实例在首次悬停时才解析，
     * 描述里写了多少张牌都不会在渲染时就把它们全建出来。
     */
    const { segment, text, organ, hoverTarget, preferPlayerCards = false } = defineProps<{
        segment: DescribeSegment,
        /** 覆盖显示文本，不传就用片段自带的 */
        text?: string,
        /** 卡牌引用按索引/实例 ID 解析时要用的器官上下文 */
        organ?: Organ,
        /** 传给卡面做数值预览的目标 */
        hoverTarget?: Entity | Entity[],
        /** 器官同时有敌人版和玩家版卡牌时，优先预览玩家版（奖励界面用） */
        preferPlayerCards?: boolean
    }>()

    const card = shallowRef<CardType | null>(null)

    const label = computed(() => text ?? segment.text)
    const glossaries = computed(() => card.value ? getCardGlossaries(card.value) : [])

    async function handleShow(shown: boolean) {
        if (!shown || card.value) return
        const resolved = await resolveCardFromSegment(segment, organ, { preferPlayerCards })
        // markRaw 防止卡牌对象被深度响应式包装
        if (resolved) card.value = markRaw(resolved)
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

.card-preview {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}
</style>
