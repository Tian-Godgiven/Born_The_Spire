<template>
<div class="battle-view">
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

    <TurnDisplay />

    <div class="drawPile center"
        @click="showCardPile('draw')">
        抽排堆：{{ drawNum }}
    </div>
    <HandPile :class="{ 'hand-elevated': handCardSelectorActive }"></HandPile>
    <div class="discardPile center"
        @click="showCardPile('discard')">
        弃牌堆: {{ pileNum.discard }}
    </div>
    <div class="exhaustPile center"
        @click="showCardPile('exhaust')">
        消耗堆: {{ pileNum.exhaust }}
    </div>

    <HandCardSelector />
</div>
</template>

<script setup lang='ts'>

    import { nowBattle } from '@/core/objects/game/battle';
    import { showCardPile } from '@/ui/interaction/cardPile';
    import { nowPlayer } from '@/core/objects/game/run';
    import { computed, watch, ref } from 'vue';
    import HandPile from './HandPile.vue';
    import Faction from '@/ui/components/object/Target/Faction.vue';
    import AllFactions from '@/ui/components/object/Target/AllFactions.vue';
    import TurnDisplay from '@/ui/components/display/TurnDisplay.vue';
    import HandCardSelector from '@/ui/components/interaction/HandCardSelector.vue';
    import { handCardSelectorActive } from '@/ui/hooks/interaction/handCardSelector';

    const emit = defineEmits<{
        'battle-end': [result: 'player_win' | 'player_lose']
    }>()

    const hasEmitted = ref(false)

    watch(() => nowBattle.value, () => {
        hasEmitted.value = false
    })

    watch(() => nowBattle.value?.isEnded, (isEnded) => {
        if (isEnded && nowBattle.value && !hasEmitted.value) {
            const result = nowBattle.value.checkBattleEnd()
            if (result) {
                hasEmitted.value = true
                emit('battle-end', result)
            }
        }
    })

    const enemyTeam = computed(()=>{
        return nowBattle.value?.getTeam("enemy")??[]
    })
    const energys = computed(()=>{
        return nowPlayer.getEnergy()
    })
    const isPlayerTurn = computed(() => {
        return nowBattle.value?.nowTurn === "player" && !handCardSelectorActive.value
    })
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
    async function endTurn(){
        if (!isPlayerTurn.value) return
        await nowBattle.value?.endPlayerTurnAndStartEnemyTurn()
    }

</script>

<style scoped lang='scss'>
.battle-view{
    position: relative;
    height: 100%;
    width: 100%;
    flex-grow: 1;
    .center{
        display: flex;
        place-items: center;
    }
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
.hand-elevated {
    z-index: 60 !important;
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
