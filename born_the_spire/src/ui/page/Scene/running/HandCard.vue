<template>
<ChooseSource :onSuccess :onHover="handleHover" :key="card.__id" ref="chooseSource" @click="handleClick" class="hand-card-wrapper">
    <CardVue :class="{useAble: useAble && !selectorActive, disabled: card.isDisabled}" :card="card" :hoverTarget="hoverTarget"/>
</ChooseSource>
</template>

<script setup lang='ts'>
    import { useCard } from '@/core/objects/item/Subclass/Card';
    import type { Card } from "@/core/objects/item/Subclass/Card"
    import CardVue from '@/ui/components/object/Card.vue';
    import ChooseSource from '@/ui/components/interaction/chooseTarget/ChooseSource.vue';
    import { computed, shallowRef, useTemplateRef, type PropType } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import { Target } from '@/core/objects/target/Target';
    import { handCardSelectorActive, toggleCardSelection } from '@/ui/hooks/interaction/handCardSelector';

    const { card } = defineProps({
        card: { type: Object as PropType<Card>, required: true }
    })

    const chooseSourceRef = useTemplateRef("chooseSource")
    const hoverTarget = shallowRef<Target | undefined>(undefined)

    const selectorActive = handCardSelectorActive

    const useAble = computed(()=>{
        return card.getInteraction("use")?true:false
    })

    // 点击处理：选择器激活时切换选中，否则正常使用卡牌
    function handleClick() {
        if (selectorActive.value) {
            if ((card as any)._chooseAble) {
                toggleCardSelection(card)
            }
            return
        }
        startChoose()
    }

    // 点击开始选择
    function startChoose(){
        // 检查卡牌是否被禁用
        if (card.isDisabled) {
            return
        }
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
        hoverTarget.value = target
    }
    //选择完成时使用卡牌效果
    function onSuccess(targets:Target[]){
        // 检查卡牌是否被禁用
        if (card.isDisabled) {
            return
        }
        useCard(card,nowPlayer.cardPiles.handPile,nowPlayer.getSelf(),targets);
        // 清除悬停目标
        hoverTarget.value = undefined
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

.disabled{
    filter: grayscale(100%);
    opacity: 0.6;
}

</style>