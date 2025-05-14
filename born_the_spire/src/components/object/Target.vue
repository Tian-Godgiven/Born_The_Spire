<template>
<div class="target">
    <div class="organs">
        <Organ :organ v-for="organ in target.getOrganList()"></Organ>
    </div>
    <div class="bottom">
        <div class="name">
            {{ target.label }}
        </div>
        <BloodLine :target></BloodLine>
    </div>
    
    
</div>
</template>

<script setup lang='ts'>
    import { Target } from '@/class/Target';
import Organ from './Organ.vue';
import BloodLine from '../display/BloodLine.vue';
    const {target} = defineProps<{target:Target}>()
</script>

<style scoped lang='scss'>
.target{
    width: 200px;
    height: 300px;
    overflow: visible;
    display: flex;
    flex-direction: column;
    .organs{
        flex-grow: 1;
    }
    .bottom{
        .name{
            text-align: center;
        }
        flex-shrink: 0;
        position: relative;
        bottom: 0;
    }
}
</style>