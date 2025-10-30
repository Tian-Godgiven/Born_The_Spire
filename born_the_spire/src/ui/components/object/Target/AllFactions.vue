<template>
<div class="allFactions" @mouseenter="onHover" @mouseleave="onLeave" @click="onClick">
    <ChooseBox :choose-state="state.chooseState"></ChooseBox>
    <slot></slot>
    
</div>
</template>

<script setup lang='ts'>
    import { nowBattle } from '@/core/objects/game/battle';
import { chooseAFaction } from '@/ui/interaction/target/chooseTarget';
import { TargetChooseState, targetManager } from '@/ui/interaction/target/targetManager';
import { ref } from 'vue';
import ChooseBox from '../../interaction/chooseTarget/ChooseBox.vue';
    const state = ref<{chooseState:TargetChooseState}>(targetManager.getFaction('all'))
    const hovering = ref(false)
    function onHover(){
        hovering.value = true
        targetManager.setFactionState("all","isHovered",true)
    }
    function onLeave(){
        hovering.value = false
        targetManager.setFactionState("all","isHovered",false)
    }
    function onClick(){
        if(!state.value?.chooseState.isSelectable)return;
        //已选中则取消
        if(state.value?.chooseState.isSelected){
            targetManager.setFactionState("all","isSelected",false)
        }
        else{
            targetManager.setFactionState("all","isSelected",true)
            //选择所有对象
            const enemys = nowBattle.value?.getTeam("enemy") ?? [];
            const players = nowBattle.value?.getTeam("player") ?? []
            chooseAFaction([...enemys,...players])
        }
    }
</script>

<style scoped lang='scss'>
.allFactions{
    width: 100%;
    height: 70%;
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: 1fr 1fr;
}
.allFactions{
    position: absolute;
    .chooseBox{
        width: 80%;
        height: 80%;
    }
}
</style>