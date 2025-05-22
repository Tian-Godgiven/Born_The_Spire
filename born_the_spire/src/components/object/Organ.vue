<template>
<div class="organ">
    {{ organ.label }}:{{ describe }}
</div>
</template>

<script setup lang='ts'>
    import { getDescribe } from '@/hooks/express/describe';
import { Organ } from '@/objects/target/Organ';
import { computed } from 'vue';
    const {organ} = defineProps<{organ:Organ}>()
    const describe = computed(()=>{
        return getDescribe(organ.describe,organ)
    })
</script>

<style scoped lang='scss'>
.organ{
    width: 100px;
    border: 2px solid black;
}
</style>