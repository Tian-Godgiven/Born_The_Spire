<template>
<div class="log" 
    @click="clickText" 
    :class="log.detail?'hasDetail':''">
        <div class="text" >
            <span v-show="showTime" class="time">[{{ dayjs(log.time).format("HH:mm:ss SSS") }}]</span>
            <span>{{ log.detail?(detailState?'▲':'▼'):'' }}</span>
            {{log.text}}
        </div>
        <div class="detail" v-show="detailState">{{ log.detail }}</div>
    </div>
</template>

<script setup lang='ts'>
import { LogUnit } from '@/ui/hooks/global/log';
import dayjs from 'dayjs';
import { ref } from 'vue';
    const {log,showTime} = defineProps<{log:LogUnit,showTime:boolean}>()
    const detailState = ref(false)
    function clickText(){
        detailState.value = !detailState.value
    }
</script>

<style scoped lang='scss'>
.log{
    margin: 5px 0;
    overflow: visible;
    &.hasDetail{
        cursor: pointer;
        padding: 2px 5px;
        box-sizing: border-box;
        user-select: none;
        border: 1px solid rgb(213, 213, 213);
        border-radius: 5px;
        background-color: rgb(252, 252, 252);
    }
}
.time{
    background-color: white;
    color: rgb(146, 146, 146);
    font-size: 14px;
}
.hover{
    background-color: white;
    color: rgb(146, 146, 146);
    font-size: 14px;
    border-radius: 4px;
    border: 1px solid black;
    font-size: 14px;
    padding: 8px;
}
.detail{
    margin-left: 20px;
}
</style>