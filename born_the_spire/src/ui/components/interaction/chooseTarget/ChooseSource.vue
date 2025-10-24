<template>
<div @pointerenter="handlePointerEnter"
     @pointerleave="handlePointerLeave" 
     class="chooseSource"
     :class="state"
     ref="source">
    <slot></slot>
</div>
</template>

<script setup lang='ts'>
    import { ChooseOption, startChooseTarget } from '@/ui/interaction/target/chooseTarget';
    import { reactive, ref, useTemplateRef } from 'vue';

    defineExpose({
        startChoose:startChoose
    })

    const state = ref<"none"|"hovering"|"choosing">("none")
    
    //元素定位
    const sourceRef = useTemplateRef("source")
    const position = reactive({
        left:0,
        top:0
    })
    window.addEventListener('resize', () => {
        getPosition()
    });
    function getPosition(){
        if(sourceRef.value){
            const {left,top} = sourceRef.value.getBoundingClientRect()
            position.left = left+(sourceRef.value?.clientWidth/2);
            position.top = top
        }
    }
    //开始选择目标
    function startChoose(option:ChooseOption){
        state.value = "choosing"
        getPosition()
        startChooseTarget(option,position,()=>{
            state.value = "none"
        })
    }
    //hover状态
    function handlePointerEnter(){
        state.value = "hovering"
    }
    function handlePointerLeave(){
        if(state.value == 'hovering'){
            state.value = "none"
        }
        
    }
</script>

<style scoped lang='scss'>
.chooseSource{
    &.hovering,&.choosing{
        transform: scale(1.2);
    }
}
</style>