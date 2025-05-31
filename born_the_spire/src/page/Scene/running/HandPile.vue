<template>
<div class="handPile center">
    <LineToTarget v-for="handCard in handPile" :chooseOption="getChooseOption(handCard)">
        <CardVue :card="handCard"/>
    </LineToTarget>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import CardVue from '@/components/object/Card.vue';
    import { nowPlayer } from '@/hooks/run';
import LineToTarget from '@/components/display/LineToTarget.vue';
import { ChooseOption } from '@/hooks/chooseTarget';
import { Card, useCard } from '@/objects/item/Card';
    //手牌堆
    const handPile = computed(()=>{
        return nowPlayer.value?.cardPiles.handPile
    })
    function getChooseOption(card:Card):ChooseOption{
        return {
            //选择目标成功时，使用卡牌
            "chooseTarget":(target)=>{
                useCard(card,handPile.value,nowPlayer.value.getSelf(),target)
            }
        }
    }
    
</script>

<style scoped lang='scss'>

</style>