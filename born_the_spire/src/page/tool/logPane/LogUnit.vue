<template>
<div class="log" @click="clickText" :class="log.detail?'hasDetail':''">
    <div class="text"  >
        <span>{{ log.detail?(detailState?'▲':'▼'):'' }}</span>
        {{log.text}}
    </div>
    <div class="detail" v-show="detailState">{{ log.detail }}</div>
</div>
</template>

<script setup lang='ts'>
    import { LogUnit } from '@/hooks/global/log';
import { ref } from 'vue';
    const {log} = defineProps<{log:LogUnit}>()
    const detailState = ref(false)
    function clickText(){
        detailState.value = !detailState.value
    }
</script>

<style scoped lang='scss'>
.log{
    margin: 5px 0;
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
.text{
    
}
.detail{
    margin-left: 20px;
}
</style>