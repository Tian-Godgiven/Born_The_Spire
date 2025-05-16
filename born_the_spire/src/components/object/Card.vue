<template>
<div class="card" ref="card">
    <div class="title">{{ card.label }}</div>
    <div class="line"></div>
    <div class="describe">{{ describe }}</div>
</div>
</template>

<script setup lang='ts'>
    import { Card } from '@/objects/Card';
    import { getDescribe } from '@/hooks/express/describe';
    import { computed } from 'vue';
    const {card} = defineProps<{card:Card}>()
    const describe = computed(()=>{
        return getDescribe(card.describe,card)
    })
    
</script>

<style scoped lang='scss'>
.card{
    flex-shrink: 0;
    width: 130px;
    height: 200px;
    border: 2px solid rgb(38, 38, 38);
    .title{
        text-align: center;
        font-size: 20px;
        font-weight: bold;
    }
    .line{
        box-sizing: border-box;
        margin: 2px 5px;
        height: 1px;
        background-color: black;
    }
    .describe{
        padding:0 5px;
        overflow-y: auto;
    }
}
</style>