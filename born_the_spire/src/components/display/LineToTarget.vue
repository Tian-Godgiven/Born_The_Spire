<template>
<div @click="onClick" ref="target">
    <slot></slot>
</div>
</template>

<script setup lang='ts'>
    import { ChooseOption, startChooseTarget } from '@/hooks/chooseTarget';
    import { reactive, useTemplateRef } from 'vue';
    //点击该div即可开始选择一个target
    const {chooseOption} = defineProps<{
        chooseOption:ChooseOption
    }>()
    
    const targetRef = useTemplateRef("target")
    const position = reactive({
        left:0,
        top:0
    })
    window.addEventListener('resize', () => {
        getPosition()
    });
    function getPosition(){
        if(targetRef.value){
            const {left,top} = targetRef.value.getBoundingClientRect()
            position.left = left+(targetRef.value?.clientWidth/2);
            position.top = top
        }
    }
    //点击元素开始选择目标
    function onClick(){
        if(targetRef.value){
            getPosition()
            //开始选择
            startChooseTarget(chooseOption,position)
        }
    }
</script>

<style scoped lang='scss'>

</style>