<template>
  <div class="logPane" ref="logPaneRef">
    <div class="title">
        <div @click="switchShow">{{ nowState ? "→":"←" }}</div>
        <div @click="clear">[清空]</div>
    </div>
    <template v-for="log in logList">
        <div class="log">{{ log }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { logList } from '@/hooks/global/log';
import gsap from 'gsap';
import { onMounted, ref, useTemplateRef } from 'vue';

const logPaneRef = useTemplateRef("logPaneRef")
let nowState = ref<boolean>(false)
onMounted(()=>{
    gsap.to(logPaneRef.value,{
        x:400
    })
    nowState.value = false
})
function switchShow(){
    if(nowState.value){
        gsap.to(logPaneRef.value,{
            x:400
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
    position: absolute;
    right: -2px;
    top: 10%;
    border:1px solid black;
    padding: 10px;
    width: 400px;
    height: 60%;
    overflow: auto;
    background-color: white;
    .title{
        display: flex;
        justify-content: space-between;
    }
    .log{
        width: 100%;
    }
}
</style>