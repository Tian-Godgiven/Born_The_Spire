<template>
<div class="battle">
    <div class="relics">遗物
        <Relic v-for="relic in relics" :relic></Relic>
    </div>

    <div class="energy center">
       能量：{{ energys.now +"/"+energys.max }}
    </div>

    <AllFactions>
        <Faction class="playerTeam" factionName="player" :charas="nowBattle?.getTeam('player')??[]"/>
        <Faction class="enemyTeam" faction-name="enemy" :charas="enemyTeam"/>
    </AllFactions>

    <div class="endTurn center" @click="endTurn">结束回合</div>

    <div class="drawPile center" 
        @click="showCardPile('draw')">
        抽排堆：{{ drawNum }}
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
    
    import Relic from '@/ui/components/object/Relic.vue';
    import { nowBattle } from '@/core/objects/game/battle';
    import { showCardPile } from '@/ui/interaction/cardPile';
    import { nowPlayer } from '@/core/objects/game/run';
    import { computed } from 'vue';
    import HandPile from './HandPile.vue';
    import Faction from '@/ui/components/object/Target/Faction.vue';
import AllFactions from '@/ui/components/object/Target/AllFactions.vue';
import { getStatusValue } from '@/core/objects/system/status/Status';
    //敌人
    const enemyTeam = computed(()=>{
        return nowBattle.value?.getTeam("enemy")??[]
    })
    //遗物
    const relics = computed(()=>{
        return nowPlayer.getRelicsList()
    })
    //能量
    const energys = computed(()=>{
        const now = getStatusValue(nowPlayer,"energy")
        const max = getStatusValue(nowPlayer,"max-energy")
        return {now,max}
    })
    //牌堆数量
    const drawNum = computed(()=>{
        return nowPlayer.cardPiles.drawPile.length
    })
    const pileNum = computed(()=>{
        const piles = nowPlayer.cardPiles
        const draw = piles.drawPile.length
        const exhaust = piles.exhaustPile.length
        const discard = piles.discardPile.length
        return {
            draw,
            exhaust,
            discard
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