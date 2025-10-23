<template>
<div class="handPile center">
    <LineToTarget v-for="handCard in handPile" :key="handCard.__id" :chooseOption="getChooseOption(handCard)">
        <CardVue :card="handCard"/>
    </LineToTarget>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import CardVue from '@/ui/components/object/Card.vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import LineToTarget from '@/ui/components/interaction/chooseTarget/LineToTarget.vue';
    import { ChooseOption } from '@/ui/interaction/target/chooseTarget';
    import { Card, useCard } from '@/core/objects/item/Card';
    //手牌堆
    const handPile = computed(()=>{
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