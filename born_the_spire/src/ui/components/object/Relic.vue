<template>
<div class="relic">
    <div>{{ relic.name }}</div>
</div>
</template>

<script setup lang='ts'>
    import { Relic } from '@/core/objects/item/Relic';
    const {relic} = defineProps<{relic:Relic}>()
</script>

<style scoped lang='scss'>

</style>