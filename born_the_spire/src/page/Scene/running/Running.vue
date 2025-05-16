<template>
<div class="running">    
    <Top></Top>
    <Battle></Battle>
    <div class="test" draggable="true">
        测试工具
        <div @click="startBattle">开始战斗</div>
    </div>
    <ConnectLine></ConnectLine>
</div>
</template>

<script setup lang='ts'>
    import Top from "./Top.vue";
    import Battle from "@/page/Scene/running/Battle.vue"
import { addToEnemyTeam, nowEnemyTeam, nowPlayerTeam, startNewBattle } from "@/hooks/battle";
import { getEnemyByKey } from "@/static/list/enemyList";
import ConnectLine from "@/components/display/ConnectLine.vue";
    function startBattle(){
        const enemy = getEnemyByKey("original_enemy_00001")
        //添加一个敌人
        addToEnemyTeam(enemy)
        startNewBattle(nowPlayerTeam,nowEnemyTeam)
    }
</script>

<style scoped lang='scss'>
.running{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .battle{
        position: relative;
        width: 100%;
        flex-grow: 1;
    }
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
}
</style>