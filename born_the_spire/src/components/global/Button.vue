<template>
    <div class="button" 
        role="button" 
        tabindex="0"  
        :aria-label="label"
        :onclick="click">
        {{label}}
    </div>
</template>

<script setup lang='ts'>
    const {click,label} = defineProps<{click:()=>void,label:string}>()
</script>

<style scoped lang='scss'>

</style>