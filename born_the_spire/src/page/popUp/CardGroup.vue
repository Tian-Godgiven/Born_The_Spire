<template>
<div>
    <CardVue v-for="card in cardGroup" :card></CardVue>
</div>
</template>

<script setup lang='ts'>
    import type { Card } from '@/class/Card';
    import CardVue from '@/components/object/Card.vue';
    const {cardGroup} = defineProps<{cardGroup:Card[]}>()
</script>

<style scoped lang='scss'>

</style>