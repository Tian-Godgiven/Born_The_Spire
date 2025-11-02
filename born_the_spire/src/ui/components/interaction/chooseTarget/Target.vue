<template>
<div class="target" 
    @mouseenter="onHover" @mouseleave="onLeave" @click="onClick">
    <ChooseBox class="chooseBox" :chooseState="targetState.chooseState"></ChooseBox>
    <slot></slot>
</div>
</template>

<script setup lang='ts'>
    import { Chara, Target } from '@/core/objects/target/Target';
import { ref } from 'vue';
import { TargetChooseState, targetManager } from '@/ui/interaction/target/targetManager';
import { chooseATarget } from '@/ui/interaction/target/chooseTarget';
import ChooseBox from './ChooseBox.vue';
    const {target} = defineProps<{target:Chara}>()
    const targetState = ref<{target:Target,chooseState:TargetChooseState}>(targetManager.addTarget(target))
    const hovering = ref(false)
    function onHover(){
        hovering.value = true
        targetManager.setTargetState(target,"isHovered",true)
    }
    function onLeave(){
        hovering.value = false
        targetManager.setTargetState(target,"isHovered",false)
    }
    function onClick(){
        //选中不可选择的目标时结束
        if(!targetState.value?.chooseState.isSelectable){
            return
        }
        //已选中则取消
        if(targetState.value?.chooseState.isSelected){
            targetManager.setTargetState(target,"isSelected",false)
        }
        else{
            targetManager.setTargetState(target,"isSelected",true)
            chooseATarget(target)
        }
    }
</script>

<style scoped lang='scss'>
.target{
    .chooseBox{
        width: 100%;
        height: 100%;
    }
    
}
</style>