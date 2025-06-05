<template>
<div class="test" draggable="true">
    测试工具
    <div @click="startBattle">开始战斗</div>
    <div @click="startTurn">回合开始</div>
    <div @click="getACard">抽一张牌</div>
</div>
</template>

<script setup lang='ts'>
    import { addToEnemyTeam, nowBattle, nowEnemyTeam, nowPlayerTeam, startNewBattle } from '@/hooks/battle';
    import { newError } from '@/hooks/global/alert';
    import { Player } from '@/objects/target/player/Player';
    import { getEnemyByKey } from '@/static/list/target/enemyList';
    function startBattle(){
        const enemy = getEnemyByKey("original_enemy_00001")
        //添加一个敌人
        addToEnemyTeam(enemy)
        startNewBattle(nowPlayerTeam,nowEnemyTeam)
    }
    function startTurn(){
        const battle = nowBattle.value
        if(!battle){
            newError(["尚未开始战斗"]);
            return;
        }
        battle.startTurn("player")
    }
    function getACard(){
        //玩家抽取一张牌
        nowPlayerTeam.forEach(player=>{
            if(player instanceof Player){
                player.drawCard(1,player)
            }
        })
    }
</script>

<style scoped lang='scss'>
.test{
    background-color: black;
    color: white;
    width: 100px;
    height: 100px;
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    z-index: 10;
}
</style>