<template>
<div class="card" ref="card">
    <div class="cost" v-if="cost">{{ cost }}</div>
    <div class="title">{{ card.label }}</div>
    <div class="line"></div>
    <div class="describe">{{ describe }}</div>
</div>
</template>

<script setup lang='ts'>
    import { Card } from '@/core/objects/item/Subclass/Card';
import { getStatusValue, ifHaveStatus } from '@/core/objects/system/status/Status';
    import { getDescribe } from '@/ui/hooks/express/describe';
    import { computed } from 'vue';
    const {card} = defineProps<{card:Card}>()
    const describe = computed(()=>{
        return getDescribe(card.describe,card)
    })
    const cost = computed(()=>{
        const ifCost = ifHaveStatus(card,"cost")
        if(ifCost){
            return getStatusValue(card,"cost")
        }
        return false
    })
    
</script>

<style scoped lang='scss'>
.card{
    background-color:white;
    position: relative;
    flex-shrink: 0;
    width: 130px;
    height: 200px;
    border: 2px solid rgb(38, 38, 38);
    .cost{
        font-size: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 2px solid black;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        position: absolute;
        left: -7px;
        top: -7px;
        background-color: white;
    }
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