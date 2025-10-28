<template>
<div class="connectLines">

    <!-- 已固定的其他选择线条 -->
    <svg class="svg" v-for="line in staticLines" :key="line.id">
        <path
            :d="`M${line.start.left},${line.start.top} 
                Q${line.start.left},${controlTop} ${line.end.left},${line.end.top}`"
            stroke="black"
            stroke-width="2"
            fill="transparent"
        />
    </svg>
    <!-- 当前的选择线条 -->
     <svg class="svg" v-show="ifShowConnectLine">
        <path
            :d="`M${start.left},${start.top} 
                Q${controlPoint.left},${controlPoint.top} ${mousePosition.left},${mousePosition.top}`"
            stroke="black"
            stroke-width="2"
            fill="transparent"
        />
    </svg>
</div>

</template>

<script setup lang='ts'>
    import { ifShowConnectLine, startPosition, staticLines } from '@/ui/interaction/target/chooseTarget';
    import { computed } from 'vue';
    import { mousePosition } from '@/ui/hooks/global/mousePosition';
    const start = computed(()=>{
        return startPosition.value
    })
    
    const controlTop = ((window.innerHeight)/2)-50
    
    const controlPoint = computed(()=>{
        const left = start.value.left
        const top = ((window.innerHeight)/2)-50
        return {
            left,
            top
        }
    })
</script>

<style scoped lang='scss'>
.svg{
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>