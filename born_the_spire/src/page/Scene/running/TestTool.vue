<template>
<div class="test" draggable="true">
    测试工具
    <div v-for="item,index in tools" @click="item.click" :key="index">
        {{ item.text }}
    </div>
</div>
</template>

<script setup lang='ts'>
    import { nowBattle, nowPlayerTeam, startNewBattle } from '@/objects/game/battle';
    import { newError } from '@/hooks/global/alert';
    import { Player } from '@/objects/target/Player';
    import { getEnemyByKey } from '@/static/list/target/enemyList';
import { nowPlayer } from '../../../objects/game/run';
    const tools = [{
        text:"开始/重启战斗",
        click:()=>{
            const enemy = getEnemyByKey("original_enemy_00001")
            startNewBattle([nowPlayer],[enemy])
        }
    },{
        text:"开始回合",
        click:()=>{
            const battle = nowBattle.value
            if(!battle){
                newError(["尚未开始战斗"]);
                return;
            }
            battle.startTurn("player")
        }
    },{
        text:"结束回合",
        click:()=>{
            const battle = nowBattle.value
            if(!battle){
                newError(["尚未开始战斗"]);
                return;
            }
            battle.endTurn("player")
        }
    },{
        text:"抽一张牌",
        click:()=>{
            //玩家抽取一张牌
            nowPlayerTeam.forEach(player=>{
                if(player instanceof Player){
                    player.drawCard(1,player)
                }
            })
        }
    }]
</script>

<style scoped lang='scss'>
.test{
    background-color: black;
    color: white;
    width: 150px;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    z-index: 10;
}
</style>