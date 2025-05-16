<template>
<div class="team">
    <TargetVue :class="ifCenter(target)?'center':''" v-for="target in team" :target></TargetVue>
</div>
</template>

<script setup lang='ts'>
    import TargetVue from './Target.vue';
    import { Target } from '@/objects/Target';
    import { nowPlayer } from '@/hooks/run';
    const {team} = defineProps<{
        team:Target[],
    }>()
    //是否是当前的玩家角色,是则放在c位
    const ifCenter = function(target:Target){
        console.log(target,nowPlayer)
        if(target.__key == nowPlayer.value.__key){
            return true
        }
        return false
    }
</script>

<style scoped lang='scss'>
.team{
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    .target{
        position: relative;
        top:50%;
        transform: translate(0,-30%);
    }
}
</style>