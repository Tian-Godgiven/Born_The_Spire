<template>
<div class="handPile center">
    <div
        v-for="(card, index) in visibleHandPile"
        :key="card.__id"
        class="hand-card-slot"
        :style="{ marginLeft: index === 0 ? '0' : cardMargin + 'px' }"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = -1"
    >
        <HandCard :card />
    </div>
</div>
</template>

<script setup lang='ts'>
    import { computed, ref } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import HandCard from './HandCard.vue';
    import { handCardSelectorActive, isCardSelected } from '@/ui/hooks/interaction/handCardSelector';

    const CARD_WIDTH = 130
    const MAX_HAND_WIDTH = 1000
    const SPREAD_EXTRA = 40 // hover 时邻居额外展开的距离

    const hoveredIndex = ref(-1)

    const visibleHandPile = computed(()=>{
        const pile = nowPlayer.cardPiles.handPile
        if (!handCardSelectorActive.value) return pile
        return pile.filter(card => (card as any)._chooseAble && !isCardSelected(card))
    })

    // 根据手牌数量计算 margin（手牌多时负值层叠）
    const cardMargin = computed(() => {
        const count = visibleHandPile.value.length
        if (count <= 1) return 0
        const totalNeeded = count * CARD_WIDTH
        const available = MAX_HAND_WIDTH
        const gap = (available - CARD_WIDTH) / (count - 1) - CARD_WIDTH
        return Math.min(15, gap) // 最大间距 15px，多了自然变负数层叠
    })
</script>

<style scoped lang='scss'>
.handPile {
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.hand-card-slot {
    transition: margin-left 0.15s ease;
}
</style>
