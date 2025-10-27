<template>
<Target :target>
    <div class="organs">
        <Organ :organ v-for="organ in target.getOrganList()"></Organ>
    </div>
    <div class="bottom">
        <div class="name">
            {{ target.label }}
        </div>
        <BloodLine :target></BloodLine>
        <div class="states" v-for="state in target.state" :key="state.key">
            <State :state></State>
        </div>
    </div>
</Target>
</template>

<script setup lang='ts'>
    import { Chara } from '@/core/objects/target/Target';
import Organ from '@/ui/components/object/Organ.vue';
import Target from './Target.vue';
import BloodLine from '@/ui/components/object/Target/BloodLine.vue';
import State from '@/ui/components/object/State.vue';
    const {target} = defineProps<{target:Chara}>()
    
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