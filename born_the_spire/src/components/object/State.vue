<template>
<div class="state">
    {{ string }}
</div>
</template>

<script setup lang='ts' generic="T extends readonly string[]">
    import { State } from '@/objects/target/State';
import { computed } from 'vue';
    const {state} = defineProps<{state:State}>()
    const string = computed(()=>{
        let string = "["+state.label
        
        string += "]"
        return string
    })
</script>

<style scoped lang='scss'>

</style>