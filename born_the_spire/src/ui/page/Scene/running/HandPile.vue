<template>
<div class="handPile center">
    <HandCard v-for="card in visibleHandPile" :card :key="card.__id"></HandCard>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import HandCard from './HandCard.vue';
    import { handCardSelectorActive, isCardSelected } from '@/ui/hooks/interaction/handCardSelector';

    //手牌堆（选择器激活时只显示可选且未选中的卡牌）
    const visibleHandPile = computed(()=>{
        const pile = nowPlayer.cardPiles.handPile
        if (!handCardSelectorActive.value) return pile
        return pile.filter(card => (card as any)._chooseAble && !isCardSelected(card))
    })
    
    
</script>

<style scoped lang='scss'>

</style>