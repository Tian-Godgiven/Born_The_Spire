<template>
<div class="organ">
    {{ organ.label }}
</div>
</template>

<script setup lang='ts'>
    import { Organ } from '@/class/Organ';
    const {organ} = defineProps<{organ:Organ}>()
</script>

<style scoped lang='scss'>
.organ{
    width: 100px;
    border: 2px solid black;
}
</style>