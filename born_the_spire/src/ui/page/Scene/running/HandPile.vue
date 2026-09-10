<template>
<div class="handPile center">
    <div
        v-for="(card, index) in visibleHandPile"
        :key="card.__id"
        class="hand-card-slot"
        :data-hand-card-id="card.__id"
        :style="{
            marginLeft: index === 0 ? '0' : cardMargin + 'px',
            visibility: hiddenHandCardIds.includes(card.__id) ? 'hidden' : 'visible',
            pointerEvents: hiddenHandCardIds.includes(card.__id) ? 'none' : 'auto'
        }"
    >
        <HandCard :card />
    </div>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import HandCard from './HandCard.vue';
    import { handCardSelectorActive, isCardSelected } from '@/ui/hooks/interaction/handCardSelector';
    import { hiddenHandCardIds } from '@/ui/animation/cardFlight';

    const CARD_WIDTH = 130
    const MAX_HAND_WIDTH = 1000

    const visibleHandPile = computed(()=>{
        const pile = nowPlayer.cardPiles.handPile
        if (!handCardSelectorActive.value) return pile
        return pile.filter(card => (card as any)._chooseAble && !isCardSelected(card))
    })

    const cardMargin = computed(() => {
        const count = visibleHandPile.value.length
        if (count <= 1) return 0
        const totalNeeded = count * CARD_WIDTH
        const available = MAX_HAND_WIDTH
        const gap = (available - CARD_WIDTH) / (count - 1) - CARD_WIDTH
        return Math.min(15, gap)
    })
</script>

<style scoped lang='scss'>
.handPile {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
}

.hand-card-slot {
    transition: margin-left 0.15s ease;
}
</style>
