<template>
<div class="target" :class="hovering?'hover':''" @mouseenter="onHover" @mouseleave="onLeave" @click="onClick">
    <div class="organs">
        <Organ :organ v-for="organ in target.getOrganList()"></Organ>
    </div>
    <div class="bottom">
        <div class="name">
            {{ target.label }}
        </div>
        <BloodLine :target></BloodLine>
        <div class="states" v-for="state in target.state" :key="state.key">
            <State :state></State>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { Chara } from '@/objects/target/Target';
import Organ from './Organ.vue';
import BloodLine from '../display/BloodLine.vue';
import { eventBus } from '@/hooks/global/eventBus';
import { ref } from 'vue';
import State from './State.vue';
    const {target} = defineProps<{target:Chara}>()
    const hovering = ref(false)
    function onHover(){
        //触发事件总线的“选中目标"
        eventBus.emit("hoverTarget",{target,callBack:(bool)=>{
            if(bool){
                hovering.value = true
            }
        }})
        //触发目标事件的“选中目标”
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