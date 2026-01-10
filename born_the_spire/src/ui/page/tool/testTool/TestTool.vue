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
    import { doEvent } from '@/core/objects/system/ActionEvent';
    import { getPotionModifier } from '@/core/objects/system/modifier/PotionModifier';

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
        text:"结束敌人回合",
        click:()=>{
            const battle = nowBattle.value
            if(!battle){
                newError(["尚未开始战斗"]);
                return;
            }
            battle.endTurn("enemy")
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
    },{
        text:"玩家受到10点伤害",
        click:()=>{
            doEvent({
                key: "damage",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "damage",
                    params: { value: 10 }
                }]
            })
        }
    },{
        text:"获得生命药剂",
        click:()=>{
            const modifier1 = getPotionModifier(nowPlayer)
            console.log("获得前 modifier:", modifier1, "units:", modifier1.getUnits().length)

            nowPlayer.getPotion("original_potion_00001")

            const modifier2 = getPotionModifier(nowPlayer)
            console.log("获得后 modifier:", modifier2, "units:", modifier2.getUnits().length)
            console.log("是同一个实例?", modifier1 === modifier2)
        }
    },{
        text:"调试：打印药水状态",
        click:()=>{
            const potionModifier = getPotionModifier(nowPlayer)
            console.log("PotionModifier units:", potionModifier.getUnits())
            console.log("Potions computed:", potionModifier.potions.value)
            console.log("Player.potions (旧):", nowPlayer.potions)
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