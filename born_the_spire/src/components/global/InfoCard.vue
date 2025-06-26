<template>
<div class="infoCard">
    <div class="title">{{ info.title }}</div>
    <div class="content">{{ info.content }}</div>
</div>
</template>

<script setup lang='ts'>
    type Info = {
        title?:string,
        content:string,
    }
    const {info} = defineProps<{
        info:Info
    }>()
</script>

<style scoped lang='scss'>

</style>