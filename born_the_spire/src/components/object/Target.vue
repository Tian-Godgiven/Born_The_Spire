<template>
<div class="target" :class="hovering?'hover':''" @mouseenter="onEnter" @mouseleave="onLeave" @click="onClick">
    <div class="organs">
        <Organ :organ v-for="organ in target.getOrganList()"></Organ>
    </div>
    <div class="bottom">
        <div class="name">
            {{ target.label }}
        </div>
        <BloodLine :target></BloodLine>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { Target } from '@/objects/Target';
import Organ from './Organ.vue';
import BloodLine from '../display/BloodLine.vue';
import { eventBus } from '@/hooks/global/eventBus';
import { ref } from 'vue';
    const {target} = defineProps<{target:Target}>()
    const hovering = ref(false)
    function onEnter(){
        eventBus.emit("hoverTarget",{target,callBack:(bool)=>{
            if(bool){
                hovering.value = true
            }
        }})
    }
    function onLeave(){
        hovering.value = false
    }
    function onClick(){
        console.log("点击了")
        //选择了一个target单位
        eventBus.emit("clickTarget",{target})
    }
</script>

<style scoped lang='scss'>
.target{
    width: 200px;
    height: 300px;
    overflow: visible;
    display: flex;
    flex-direction: column;
    &.hover{
        outline: 2px solid black;
    }
    .organs{
        flex-grow: 1;
    }
    .bottom{
        .name{
            text-align: center;
        }
        flex-shrink: 0;
        position: relative;
        bottom: 0;
    }
}
</style>