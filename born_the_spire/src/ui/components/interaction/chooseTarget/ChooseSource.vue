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
    import { Target } from '@/core/objects/target/Target';
import { Entity } from '@/core/objects/system/Entity';
import { TargetType } from '@/static/list/registry/chooseTargetType';
import { startChooseTarget } from '@/ui/interaction/target/chooseTarget';
    import { reactive, ref, useTemplateRef } from 'vue';

    const {onStop,onHover,onSuccess} = defineProps<{onStop?:()=>void,onHover?:()=>{},onSuccess:(targets:Target[])=>void}>()

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
    function startChoose({targetType,source,ifShowConnectLine}:{targetType:TargetType,source?:Entity,ifShowConnectLine?:boolean}){
        state.value = "choosing"
        getPosition()
        startChooseTarget({
            ifShowConnectLine,
            targetType,
            source,
            onSuccess:(targets)=>{
                onSuccess(targets)
                state.value = "none"
            },
            onStop:()=>{
                onStop?.()
                state.value = "none"
            }
        },position)
    }
    //hover状态
    function handlePointerEnter(){
        //当前不在选择状态
        if(state.value == 'none'){
            state.value = "hovering"
            onHover?.()
        }
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