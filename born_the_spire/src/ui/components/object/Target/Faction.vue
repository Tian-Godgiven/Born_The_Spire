<template>
<div class="faction"  
    @mouseenter="onHover" @mouseleave="onLeave" @click="onClick">
    <ChooseBox :chooseState="chooseState.chooseState"></ChooseBox>
    <CharaVue :class="ifCenter(target)?'center':''" v-for="target in charas" :target :side="whichSide" />
</div>
</template>

<script setup lang='ts'>
    import { Chara } from '@/core/objects/target/Target';
    import { computed, ref } from 'vue';
    import { TargetChooseState, targetManager } from '@/ui/interaction/target/targetManager';
    import { chooseAFaction } from '@/ui/interaction/target/chooseTarget';
    import { nowPlayer } from '@/core/objects/game/run';
    import CharaVue from './Chara/Chara.vue';
    import ChooseBox from '../../interaction/chooseTarget/ChooseBox.vue';
    const {charas,factionName} = defineProps<{
        charas:Chara[],
        factionName:string
    }>()
    //是否是当前的玩家角色,是则放在c位
    const ifCenter = function(target:Chara){
        if(target.__key == nowPlayer?.__key){
            return true
        }
        return false
    }
    //阵营在哪边
    const whichSide = computed(()=>{
        if(factionName == "player"){
            return "left"
        }
        else{
            return "right"
        }
    })
    //阵营的选择状态
    const chooseState = ref<{chooseState:TargetChooseState}>(getChooseState())
    function getChooseState(){
        if(!["enemy","player","all"].includes(factionName)){
            return targetManager.addFaction(factionName)
        }
        else{
            //获得阵营的状态管理
            return targetManager.getFaction(factionName)
        }
    }
    const hovering = ref(false)
    function onHover(){
        hovering.value = true
        targetManager.setFactionState(factionName,"isHovered",true)
    }
    function onLeave(){
        hovering.value = false
        targetManager.setFactionState(factionName,"isHovered",false)
    }
    function onClick(){
        if(!chooseState.value?.chooseState.isSelectable){
            return
        }
        //已选中则取消
        if(chooseState.value?.chooseState.isSelected){
            targetManager.setFactionState(factionName,"isSelected",false)
        }
        else{
            targetManager.setFactionState(factionName,"isSelected",true)
            chooseAFaction(charas)
        }
    }
</script>

<style scoped lang='scss'>
.faction{
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    .chooseBox{
        width: 80%;
        height: 80%;
    }
    .target{
        position: relative;
        top: 50%;
        transform: translate(0,-30%);
    }
}
</style>