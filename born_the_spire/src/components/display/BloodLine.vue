<template>
<div class="bloodLine">
    <div class="white">
        <div>{{ blood.now +"/"+blood.max }}</div>
    </div>
    <div class="black">
        <div>{{ blood.now +"/"+blood.max }}</div>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { Target } from '@/class/Target';
import { computed } from 'vue';
    const {target} = defineProps<{target:Target}>()
    const blood = computed(()=>{
        const health = target.getStatusByKey("original_status_00001")
        return (health.value as {now:number,max:number})
    })
</script>

<style scoped lang='scss'>
.bloodLine{
    width: 200px;
    height: 20px;
    overflow: hidden;
    border-radius: 30px;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    outline: 2px solid black;
    outline-offset: 2px;
    background-color: white;
    .black,.white{
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        >div{
            line-height: 1rem;
            flex-shrink: 0;
            width: 200px;
            text-align: center;
        }
    }
    .black{
        overflow: hidden;
        background-color: black;
        color: white;
    }
    .white{
        background-color: white;
        color: black;
    }
}
</style>