<template>
<div class="wrapper">
    <div class="title">蘇生尖塔</div>
    <div class="control">
        <div v-for="item in buttonList" @click="item.click">
            {{ item.label }}
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { startNewRun } from '@/objects/game/run';

    const buttonList:{label:string,click:()=>void}[] = [
        {label:"开始游戏",click:()=>startNewRun()}
    ]
</script>

<style scoped lang='scss'>
.wrapper{
    width: 100%;
    height: 100%;
}
.title{
    font-size: 100px;
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translate(-50%,-90%);
}
.control{
    cursor: pointer;
    position: absolute;
    left: 50%;
    top: 40%;
    font-size: 30px;
    transform: translate(-50%,-100%);
}
</style>