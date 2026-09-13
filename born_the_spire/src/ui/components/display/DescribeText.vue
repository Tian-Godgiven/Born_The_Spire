<template>
<span class="describe-text" ref="rootRef">
    <template v-for="(segment, index) in segments" :key="index">
        <CardRefText
            v-if="segment.type === 'card'"
            :segment="segment"
            :text="getCardText(segment)"
            :organ="organ"
            :hoverTarget="hoverTarget"
            :preferPlayerCards="preferPlayerCards"
            :anchor="anchorEl"
        />
        <OrganRefText
            v-else-if="segment.type === 'organ' && segment.organKey"
            :organ-key="segment.organKey"
            :evolution-rounds="segment.evolutionRounds ?? 0"
        />
        <RelicRefText
            v-else-if="segment.type === 'relic' && segment.relicKey"
            :relic-key="segment.relicKey"
        />
        <DescribeFxText
            v-else-if="segment.type === 'fx'"
            :text="segment.text"
            :fx-keys="segment.fxKeys ?? []"
            :beat-start="segment.beatStart"
            :beat-char="segment.beatChar"
        />
        <br v-else-if="segment.type === 'break'">
        <span
            v-else
            :class="{ 'glossary-term': segment.type === 'glossary' }"
            :style="segment.type === 'glossary' ? segment.style : undefined"
        >{{ segment.text }}</span>
    </template>
</span>
<Popover
    inline
    :trigger-element="anchorEl"
    :disabled="glossaryDisabled || panelItems.length === 0 || !anchorEl"
    :placement="glossaryPlacement"
    :align="glossaryAlign"
    :order="glossaryOrder"
>
    <template #content>
        <GlossaryPanel :items="panelItems" />
    </template>
</Popover>
</template>

<script setup lang='ts'>
    import { computed, nextTick, onMounted, ref, watch } from 'vue'
    import CardRefText from '@/ui/components/display/CardRefText.vue'
    import OrganRefText from '@/ui/components/display/OrganRefText.vue'
    import RelicRefText from '@/ui/components/display/RelicRefText.vue'
    import DescribeFxText from '@/ui/components/display/DescribeFxText.vue'
    import GlossaryPanel from '@/ui/components/display/GlossaryPanel.vue'
    import Popover from '@/ui/components/global/Popover.vue'
    import { getDescribeStructured, composeOrganDescribe, type Describe, type DescribeSegment } from '@/ui/hooks/express/describe'
    import { findCardInstance } from '@/ui/hooks/express/cardSegment'
    import { collectGlossaryItems, type ExtraGlossary } from '@/ui/hooks/express/glossary'
    import type { Organ } from '@/core/objects/target/Organ'
    import type { Entity } from '@/core/objects/system/Entity'

    /**
     * 结构化描述文本
     *
     * 把 describe 数据渲染成带样式的一段文字：数值就地取值，术语加下划线，
     * 卡牌引用交给 CardRefText 自带悬停预览，这段文字里的 $ 和 extraGlossaries
     * 组成术语板。凡是要显示 describe 的地方都用它，不要各自再写一遍
     * v-for + getDescribeStructured，也不要在外面再挂一块 GlossaryPanel。
     */
    const {
        describe,
        target,
        bracketCards = false,
        hoverTarget,
        preferPlayerCards = false,
        glossaryAnchor = "parent",
        glossaryPlacement = "right",
        glossaryAlign,
        glossaryOrder,
        glossaryDisabled = false,
        extraGlossaries
    } = defineProps<{
        describe?: Describe,
        /** 描述里取值的对象（器官/卡牌/遗物自身） */
        target?: object,
        /** 卡名是否用【】包起来 */
        bracketCards?: boolean,
        /** 传给卡面预览做数值预览的目标 */
        hoverTarget?: Entity | Entity[],
        /** 器官同时有敌人版和玩家版卡牌时，优先预览玩家版（奖励界面用） */
        preferPlayerCards?: boolean,
        /**
         * 术语板的悬停触发区。默认是这段文字的父节点；self 是文字根节点；
         * 传入 HTMLElement 则整块区域（整张卡、器官介绍框）都能唤出术语板。
         */
        glossaryAnchor?: HTMLElement | "parent" | "self",
        glossaryPlacement?: "left" | "right" | "top" | "bottom",
        glossaryAlign?: "start" | "center" | "trigger" | number,
        /** 同一锚点排队序号。器官介绍用 1，卡面不要写 */
        glossaryOrder?: number,
        glossaryDisabled?: boolean,
        /** 词条、一次性名词。不要让本组件去翻 target.entry */
        extraGlossaries?: ExtraGlossary[]
    }>()

    const rootRef = ref<HTMLElement | null>(null)
    const anchorEl = ref<HTMLElement | null>(null)

    function resolveAnchor() {
        const spec = glossaryAnchor
        if (spec instanceof HTMLElement) {
            anchorEl.value = spec
            return
        }
        if (spec === "self") {
            anchorEl.value = rootRef.value
            return
        }
        anchorEl.value = rootRef.value?.parentElement ?? rootRef.value ?? null
    }

    watch(() => glossaryAnchor, () => nextTick(resolveAnchor), { immediate: true })
    watch(rootRef, () => nextTick(resolveAnchor))
    onMounted(() => { nextTick(resolveAnchor) })

    const segments = computed(() => {
        const t = target as any
        const isOrganBody = t
            && (describe === undefined || describe === t.describe)
            && (t.targetType === "organ" || t.cards || t.cardsByOwner)
        const resolved = isOrganBody ? composeOrganDescribe(t, { preferPlayerCards }) : describe
        return getDescribeStructured(resolved, target)
    })

    const panelItems = computed(() => collectGlossaryItems(extraGlossaries, describe))

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
            if (card) return `【${card.displayName}】`
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
