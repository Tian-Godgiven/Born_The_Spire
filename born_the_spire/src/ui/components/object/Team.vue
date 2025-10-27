<template>
<div class="team">
    <CharaVue :class="ifCenter(target)?'center':''" v-for="target in team" :target />
</div>
</template>

<script setup lang='ts'>
    import {type Chara} from '@/core/objects/target/Target';
    import { nowPlayer } from '@/core/objects/game/run';
    import CharaVue from './Target/Chara.vue';
    const {team} = defineProps<{
        team:Chara[],
    }>()
    //是否是当前的玩家角色,是则放在c位
    const ifCenter = function(target:Chara){
        if(target.__key == nowPlayer?.__key){
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