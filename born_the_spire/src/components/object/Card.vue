<template>
<div>
    <div>{{ card.label }}</div>
</div>
</template>

<script setup lang='ts'>
    import { Card } from '@/class/Card';
    const {card} = defineProps<{card:Card}>()
</script>

<style scoped lang='scss'>

</style>