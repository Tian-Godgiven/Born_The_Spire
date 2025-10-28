<template>
<ChooseSource :key="card.__id" ref="chooseSource" @click="startChoose">
    <CardVue :class="{useAble}" :card="card"/>
</ChooseSource>
</template>

<script setup lang='ts'>
    import { Card, useCard } from '@/core/objects/item/Card';
    import CardVue from '@/ui/components/object/Card.vue';
    import ChooseSource from '@/ui/components/interaction/chooseTarget/ChooseSource.vue';
    import { computed, useTemplateRef } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    const {card} = defineProps<{card:Card}>()
    const chooseSourceRef = useTemplateRef("chooseSource")
    const useAble = computed(()=>{
        return card.getInteraction("use")?true:false
    })
    //点击开始选择
    function startChoose(){
        if(!chooseSourceRef.value)return;
        const interaction = card.getInteraction("use")
        if(!interaction){
            //未完成，无法使用的卡牌的效果
            return 
        }
        chooseSourceRef.value.startChoose({
            targetType:interaction.target,
            "onSuccess":(target)=>useCard(card,
                                        nowPlayer.cardPiles.handPile,
                                        nowPlayer.getSelf(),
                                        target)
        })
    }
</script>

<style scoped lang='scss'>
.useAble{
    box-shadow: 0px 0px 8px rgb(0, 0, 0);
}
</style>