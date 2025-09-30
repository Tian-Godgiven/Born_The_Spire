<template>
  <div class="logPane" ref="logPaneRef">
    <div class="title">
        <div @click="switchShow">{{ nowState ? "←":"→" }}</div>
        <div @click="clear">清空</div>
    </div>
    <template v-for="log in logList">
        <div class="log">{{ log }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { logList } from '@/hooks/global/log';
import gsap from 'gsap';
import { ref, useTemplateRef } from 'vue';

const logPaneRef = useTemplateRef("logPaneRef")
let nowState = ref<boolean>(false)
function switchShow(){
    if(nowState.value){
        gsap.to(logPaneRef.value,{
            x:300
        })
        nowState.value = false
    }
    else{
        gsap.to(logPaneRef.value,{
            x:0
        })
        nowState.value = true
    }
}
function clear(){
    logList.value = []
}
</script>

<style scoped lang="scss">
.logPane{
    background-color: white;
    position: absolute;
    right: -2px;
    top: 10%;
    border:1px solid rgb(64, 59, 59);
    padding: 10px;
    width: 300px;
    height: 60%;
    overflow: auto;
    z-index: 10000;
    .log{
        width: 100%;
    }
}
</style>