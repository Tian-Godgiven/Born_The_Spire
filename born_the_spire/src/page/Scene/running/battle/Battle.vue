<template>
    <div>战斗</div>
    <div class="relics">
        <div class="relic" v-for="relic in relics">
            {{ relic.name }}
        </div>
    </div>

    <div class="energy">
        
    </div>

    <div class="cardGroup"></div>
    <div class="handCards">

    </div>
</template>

<script setup lang='ts'>
import { nowPlayer } from '@/hooks/run';
import { computed } from 'vue';

    const relics = computed(()=>{
        return nowPlayer.value.getRelicsList()
    })
</script>

<style scoped lang='scss'>
.relics{
    position: absolute;
    top: 0;
    width: 100%;
    height: 100px;
}
.energy{

}
.cardGroup{

}
.handCards{
    position: absolute;
    bottom: 0;
    width: 100px;
    height: 300px;
    left: 50%;
    transform: translateX(-50%);
}
</style>