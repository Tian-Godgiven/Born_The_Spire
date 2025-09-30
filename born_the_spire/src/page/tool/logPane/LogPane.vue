<template>
  <div class="logPane" ref="logPaneRef">
    <div class="title">
        <div @click="switchShow">{{ nowState ? "→":"←" }}</div>
        <div class="control">
            <div>
                <input type="checkbox" v-model="showTime">
                <span>时间</span>
            </div>
            <div @click="clear">[清空]</div>
        </div>
        
    </div>
    <template v-for="log in logList">
        <LogUnit :log :showTime></LogUnit>
    </template>
  </div>
</template>

<script setup lang="ts">
import { logList } from '@/hooks/global/log';
import gsap from 'gsap';
import { onMounted, ref, useTemplateRef } from 'vue';
import LogUnit from './LogUnit.vue';

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

//显示日志打印时间
const showTime = ref(false)

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
    overflow-y: auto;
    overflow-x: visible;
    background-color: white;
    .title{
        display: flex;
        justify-content: space-between;
        .control{
            display: flex;
            gap: 15px;
        }
    }
    .log{
        width: 100%;
    }
}
</style>