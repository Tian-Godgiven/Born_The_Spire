<template>
<div class="organ"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false">
    {{ organ.label }}:{{ describe }}

    <!-- 词条显示 -->
    <EntryDisplay
        v-if="hovering"
        :entries="organ.entry"
        :side="side ?? 'right'" />
</div>
</template>

<script setup lang='ts'>
    import { getDescribe } from '@/ui/hooks/express/describe';
import { Organ } from '@/core/objects/target/Organ';
import { computed, ref } from 'vue';
import EntryDisplay from './EntryDisplay.vue';

    const {organ, side} = defineProps<{
        organ: Organ
        side?: 'left' | 'right'  // 可选，默认右侧
    }>()

    const hovering = ref(false)

    const describe = computed(()=>{
        return getDescribe(organ.describe,organ)
    })
</script>

<style scoped lang='scss'>
.organ{
    position: relative;  // 为 EntryDisplay 提供定位上下文
    width: 100px;
    border: 2px solid black;
}
</style>