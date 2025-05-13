<template>
    <Top></Top>
    <component :is="list[nowScene]"></component>
</template>

<script setup lang='ts'>
    import { nowScene } from '@/hooks/changeScene';
    import Battle from "@/page/Scene/running/battle/Battle.vue"
    import Map from './map/Map.vue';
    import Top from './Top.vue';
    const list = {
        "battle":Battle,
        "map":Map
    }
</script>

<style scoped lang='scss'>

</style>