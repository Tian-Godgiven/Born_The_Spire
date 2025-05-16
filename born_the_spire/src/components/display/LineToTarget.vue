<template>
<div @click="onClick" ref="target">
    <slot></slot>
</div>
</template>

<script setup lang='ts'>
    import { ChooseSource, startChooseTarget } from '@/hooks/chooseTarget';
    import { reactive, useTemplateRef } from 'vue';
    const {chooseSource} = defineProps<{
        chooseSource:ChooseSource
    }>()
    
    const cardRef = useTemplateRef("target")
    const cardPosition = reactive({
        left:0,
        top:0
    })
    window.addEventListener('resize', () => {
        getPosition()
    });
    function getPosition(){
        if(cardRef.value){
            const {left,top} = cardRef.value.getBoundingClientRect()
            cardPosition.left = left+(cardRef.value?.clientWidth/2);
            cardPosition.top = top
        }
    }
    //点击元素开始选择目标
    function onClick(){
        if(cardRef.value){
            getPosition()
            //开始选择
            startChooseTarget(chooseSource,cardPosition)
        }
    }
</script>

<style scoped lang='scss'>

</style>