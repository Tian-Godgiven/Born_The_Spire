<template>
    <div>苏生尖塔</div>
    <div>
        <div v-for="item in buttonList" @click="item.click">
            {{ item.label }}
        </div>
    </div>
</template>

<script setup lang='ts'>
    import { startNewRun } from '@/hooks/run';

    const buttonList:{label:string,click:()=>void}[] = [
        {label:"开始游戏",click:()=>startNewRun()}
    ]
</script>

<style scoped lang='scss'>

</style>