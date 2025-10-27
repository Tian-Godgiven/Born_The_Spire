<template>
<div class="target" 
    :class="{
        hovering: hovering,
        selectable: targetState?.chooseState.isSelectable,
        selected: targetState?.chooseState.isSelected,}" 
    @mouseenter="onHover" @mouseleave="onLeave" @click="onClick">
    <slot></slot>
</div>
</template>

<script setup lang='ts'>
    import { Chara, Target } from '@/core/objects/target/Target';
import { onMounted, ref } from 'vue';
import { TargetChooseState, targetManager } from '@/ui/interaction/target/targetManager';
    const {target} = defineProps<{target:Chara}>()
    const targetState = ref<{target:Target,chooseState:TargetChooseState}>()
    onMounted(()=>{
        //为target添加状态管理
        targetState.value = targetManager.addTarget(target)
    })
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
        //已选中则取消
        if(targetState.value?.chooseState.isSelected){
            targetManager.setTargetState(target,"isSelected",false)
        }
        else{
            targetManager.setTargetState(target,"isSelected",true)
        }
    }
</script>

<style scoped lang='scss'>
.target{
    &.selectable{
        outline: 2px dashed grey;
        &.hovering{
            outline: 2px solid grey;
        }
        &.selected{
            outline: 2px solid black;
            &.hovering{
                outline: 2px solid black;
            }
        }
    }
    
}
</style>