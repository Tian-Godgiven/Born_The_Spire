<template>
<div class="handPile center">
    <HandCard v-for="card in handPile" :card :key="card.__id"></HandCard>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import HandCard from './HandCard.vue';
    
    //手牌堆
    const handPile = computed(()=>{
        return nowPlayer.cardPiles.handPile
    })
    
    
</script>

<style scoped lang='scss'>

</style>