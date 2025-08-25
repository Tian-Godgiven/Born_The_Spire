<template>
<div class="handPile center">
    <LineToTarget v-for="handCard in handPile" :key="Symbol()" :chooseOption="getChooseOption(handCard)">
        <CardVue :card="handCard"/>
    </LineToTarget>
</div>
</template>

<script setup lang='ts'>
    import { computed, watch } from 'vue';
    import CardVue from '@/components/object/Card.vue';
    import { nowPlayer } from '@/objects/game/run';
    import LineToTarget from '@/components/display/LineToTarget.vue';
    import { ChooseOption } from '@/interaction/target/chooseTarget';
    import { Card, useCard } from '@/objects/item/Card';
    //手牌堆
    const handPile = computed(()=>{
        console.log(nowPlayer.cardPiles)
        return nowPlayer.cardPiles.handPile
    })
    function getChooseOption(card:Card):ChooseOption{
        return {
            //选择目标成功时，使用卡牌
            "chooseTarget":(target)=>{
                useCard(card,handPile.value,nowPlayer.getSelf(),target)
            }
        }
    }
    
</script>

<style scoped lang='scss'>

</style>