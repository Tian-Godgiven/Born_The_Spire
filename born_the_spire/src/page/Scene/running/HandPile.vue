<template>
<div class="handPile center">
    <LineToTarget v-for="handCard in handPile" :chooseSource="getChooseSource(handCard)">
        <CardVue :card="handCard"/>
    </LineToTarget>
</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue';
    import CardVue from '@/components/object/Card.vue';
    import { nowPlayer } from '@/hooks/run';
import LineToTarget from '@/components/display/LineToTarget.vue';
import { ChooseSource } from '@/hooks/chooseTarget';
import { Card } from '@/objects/item/Card';
    //手牌
    const handPile = computed(()=>{
        return nowPlayer.value?.cardPiles.handPile
    })
    function getChooseSource(card:Card):ChooseSource{
        return {
            //触发卡牌效果
            "chooseTarget":(target)=>{
                card.useCard(nowPlayer.value.getSelf(),target)
            }
        }
    }
    
</script>

<style scoped lang='scss'>

</style>