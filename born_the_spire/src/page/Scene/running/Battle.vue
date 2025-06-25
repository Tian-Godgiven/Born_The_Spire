<template>
<div class="battle">
    <div class="relics">遗物
        <Relic v-for="relic in relics" :relic></Relic>
    </div>

    <div class="energy center">
       能量：{{ energys.now +"/"+energys.max }}
    </div>

    <div class="teams">
        <Team class="playerTeam" :team="nowBattle?.getTeam('player')??[]"></Team>
        <Team class="enemyTeam" :team="nowBattle?.getTeam('enemey')??[]"></Team>
    </div>

    <div class="endTurn center" @click="endTurn">结束回合</div>

    <div class="drawPile center" 
        @click="showCardPile('draw')">
        抽排堆：{{ pileNum.draw }}
    </div>
    <HandPile></HandPile>
    <div class="discardPile center" 
        @click="showCardPile('discard')">
        弃牌堆: {{ pileNum.discard }}
    </div>
    <div class="exhaustPile center" 
        @click="showCardPile('exhaust')">
        消耗堆: {{ pileNum.exhaust }}
    </div>
</div>
</template>

<script setup lang='ts'>
    
    import Relic from '@/components/object/Relic.vue';
    import { nowBattle } from '@/hooks/battle';
    import { showCardPile } from '@/hooks/showCardPile';
    import { nowPlayer } from '@/hooks/run';
    import { computed } from 'vue';
    import Team from '@/components/object/Team.vue';
    import HandPile from './HandPile.vue';
import { getStatusValue } from '@/objects/system/Status';
    //遗物
    const relics = computed(()=>{
        return nowPlayer.getRelicsList()
    })
    //能量
    const energys = computed(()=>{
        const now = getStatusValue(nowPlayer,"energy")
        const max = getStatusValue(nowPlayer,"energy","max")
        return {now,max}
    })
    //牌堆数量
    const pileNum = computed(()=>{
        const piles = nowPlayer.cardPiles
        return {
            draw:piles.drawPile.length,
            exhaust:piles.exhaustPile.length,
            discard:piles.discardPile.length
        }
    })
    //结束当前回合
    function endTurn(){
        nowBattle.value?.endTurn("player")
    }
    
</script>

<style scoped lang='scss'>
.battle{
    position: relative;
    height: 100%;
    width: 100%;
    flex-grow: 1;
    .center{
        display: flex;
        place-items: center;
    }
}
.relics{
    position: absolute;
    top: 0;
    width: 100%;
    height: 100px;
}
.teams{
    width: 100%;
    height: 70%;
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: 1fr 1fr;
}
.energy{
    width: 100px;
    height: 100px;
    position: absolute;
    left: 130px;
    bottom: 100px;
}
.endTurn{
    width: 100px;
    height: 50px;
    position: absolute;
    right: 230px;
    bottom: 120px;
}
.handPile{
    z-index: 10;
    position: absolute;
    bottom: 0;
    gap: 15px;
    height: 300px;
    left: 50%;
    transform: translateX(-50%);
}
.drawPile{
    height: 100px;
    width: 100px;
    position: absolute;
    left: 50px;
    bottom: 40px;
}
.discardPile{
    height: 100px;
    width: 100px;
    position: absolute;
    right: 50px;
    bottom: 40px;
}
.exhaustPile{
    height: 100px;
    width: 100px;
    position: absolute;
    right: 50px;
    bottom: 120px;
}
</style>