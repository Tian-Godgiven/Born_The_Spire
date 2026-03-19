<template>
<div class="mask"  :style="{opacity:maskAlpha}"></div>
</template>

<script setup lang='ts'>
    const {
        maskAlpha=0.5
    } = defineProps<{
        maskAlpha?:number}>()
</script>

<style scoped lang='scss'>
.mask{
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 0;
    background-color: black;
}
</style>