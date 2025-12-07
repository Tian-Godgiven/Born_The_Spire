<template>
<div class="test" draggable="true">
    测试工具
    <div class="item" v-for="item,index in tools" @click="item.click" :key="index">
        {{ item.text }}
    </div>
</div>
</template>

<script setup lang='ts'>
    import { nowBattle, nowPlayerTeam, startNewBattle } from '@/core/objects/game/battle';
    import { newError } from '@/ui/hooks/global/alert';
    import { Player } from '@/core/objects/target/Player';
    import { getEnemyByKey } from '@/static/list/target/enemyList';
    import { nowPlayer } from '@/core/objects/game/run';
import { before } from 'lodash';
    const tools = [{
        text:"开始/重启战斗",
        click:async()=>{
            const enemy = getEnemyByKey("original_enemy_00001")
            // const enemy2 = getEnemyByKey("original_enemy_00001")
            startNewBattle([nowPlayer],[enemy,
            // enemy2
        ])
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
            for(let player of nowPlayerTeam){
                if(player instanceof Player){
                    player.drawCard(1,player)
                }
            }
        }
    },{
        text:"打印玩家的特殊触发器",
        click:()=>{
            console.log("默认触发器:",nowPlayer.trigger._defaultTrigger)
            console.log("关键触发器:",nowPlayer.trigger._importantTrigger)

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
    .item{
        cursor: pointer;
    }
}
</style>