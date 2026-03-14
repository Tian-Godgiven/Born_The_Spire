<template>
<ChooseSource :onSuccess :onHover="handleHover" :key="card.__id" ref="chooseSource" @click="startChoose" class="hand-card-wrapper">
    <CardVue :class="{useAble}" :card="card" :hoverTarget="hoverTarget"/>
</ChooseSource>
</template>

<script setup lang='ts'>
    // import { useCard } from '@/core/objects/item/Subclass/Card';
    import type { Card } from "@/core/objects/item/Subclass/Card"
    import CardVue from '@/ui/components/object/Card.vue';
    import ChooseSource from '@/ui/components/interaction/chooseTarget/ChooseSource.vue';
    import { computed, ref, useTemplateRef } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import { Target } from '@/core/objects/target/Target';
    const {card} = defineProps<{card:Card}>()
    const chooseSourceRef = useTemplateRef("chooseSource")
    const hoverTarget = ref<Target | null>(null)

    const useAble = computed(()=>{
        return card.getInteraction("use")?true:false
    })
    //点击开始选择
    function startChoose(){
        if(!chooseSourceRef.value)return;
        const interaction = card.getInteraction("use")
        if(!interaction){
            //未完成，无法使用的卡牌的提示效果
            return
        }
        chooseSourceRef.value.startChoose({
            targetType:interaction.target,
            source:nowPlayer.getSelf(),  // 传递使用者信息
        })
    }
    //悬停时更新目标（用于预览）
    function handleHover(target?: Target){
        hoverTarget.value = target || null
    }
    //选择完成时使用卡牌效果
    function onSuccess(targets:Target[]){
        // useCard(card,nowPlayer.cardPiles.handPile,nowPlayer.getSelf(),targets);
        // 清除悬停目标
        hoverTarget.value = null
    }
</script>

<style scoped lang='scss'>
.hand-card-wrapper {
    position: relative;
    z-index: 10;

    &:hover {
        z-index: 200;
    }
}

.useAble{
    box-shadow: 0px 0px 8px rgb(0, 0, 0);
}
</style>