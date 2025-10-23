<template>
<div class="state">
    {{ string }}
</div>
</template>

<script setup lang='ts' generic="T extends readonly string[]">
    import { State } from '@/core/objects/system/State';
    import { computed } from 'vue';
    const {state} = defineProps<{state:State}>()
    const string = computed(()=>{
        let string = `[${state.label}`
        //层数
        for(let stack of state.stacks){
            if(stack.showType!="bool"){
                string +=` ${stack.stack} `
            }
        }
        string += "]"
        return string
    })
</script>

<style scoped lang='scss'>

</style>