<template>
<svg class="svg" v-show="ifShowConnectLine">
    <path
        :d="`M${start.left},${start.top} 
             Q${controlPoint.left},${controlPoint.top} ${mousePosition.left},${mousePosition.top}`"
        stroke="black"
        stroke-width="2"
        fill="transparent"
      />
</svg>
</template>

<script setup lang='ts'>
    import { ifShowConnectLine, startPosition } from '@/ui/interaction/target/chooseTarget';
    import { computed } from 'vue';
    import { mousePosition } from '@/ui/hooks/global/mousePosition';
    const start = computed(()=>{
        return startPosition.value
    })
    
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