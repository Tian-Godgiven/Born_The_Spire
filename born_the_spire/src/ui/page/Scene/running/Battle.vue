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

    <div
        class="endTurn center"
        :class="{ disabled: !isPlayerTurn }"
        @click="endTurn"
    >
        结束回合
    </div>

    <!-- 回合提示显示 -->
    <TurnDisplay />

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

    <!-- 奖励页面 -->
    <RewardPage />
</div>
</template>

<script setup lang='ts'>

    import Relic from '@/ui/components/object/Relic.vue';
    import { nowBattle } from '@/core/objects/game/battle';
    import { showCardPile } from '@/ui/interaction/cardPile';
    import { nowPlayer, nowGameRun } from '@/core/objects/game/run';
    import { computed, watch, ref } from 'vue';
    import HandPile from './HandPile.vue';
    import Faction from '@/ui/components/object/Target/Faction.vue';
    import AllFactions from '@/ui/components/object/Target/AllFactions.vue';
    import TurnDisplay from '@/ui/components/display/TurnDisplay.vue';
    import RewardPage from '@/ui/components/interaction/RewardPage.vue';

    // 防止重复完成房间
    const hasCompleted = ref(false)

    // 监听战斗结束
    watch(() => nowBattle.value?.isEnded, async (isEnded) => {
        if (isEnded && nowBattle.value && !hasCompleted.value) {
            // 检查战斗结果
            const result = nowBattle.value.checkBattleEnd()
            if (result === 'player_win') {
                // 标记为已完成，防止重复触发
                hasCompleted.value = true
                // 胜利：完成房间，显示奖励
                await nowGameRun.completeCurrentRoom()
            } else if (result === 'player_lose') {
                // 失败：TODO 处理失败逻辑
                console.log('[Battle] 战斗失败')
            }
        }
    })

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
        return nowPlayer.getEnergy()
    })
    //是否为玩家回合
    const isPlayerTurn = computed(() => {
        return nowBattle.value?.nowTurn === "player"
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
    async function endTurn(){
        if (!isPlayerTurn.value) return
        await nowBattle.value?.endPlayerTurnAndStartEnemyTurn()
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
    z-index: 100;
}
.endTurn{
    width: 120px;
    height: 50px;
    position: absolute;
    right: 200px;
    bottom: 120px;
    z-index: 100;
    background: #f0f0f0;
    border: 2px solid black;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(.disabled) {
        background: #e0e0e0;
    }

    &.disabled {
        cursor: not-allowed;
        background: #999;
        color: #666;
    }
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
    z-index: 100;
}
.discardPile{
    height: 100px;
    width: 100px;
    position: absolute;
    right: 50px;
    bottom: 40px;
    z-index: 100;
}
.exhaustPile{
    height: 100px;
    width: 100px;
    position: absolute;
    right: 50px;
    bottom: 120px;
    z-index: 100;
}
</style>