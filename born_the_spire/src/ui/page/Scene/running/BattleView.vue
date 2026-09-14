<template>
<div class="battle-view">
    <div class="energy center">
        <span class="energy-label">能量</span>
        <span class="energy-value">{{ energys.now }}/{{ energys.max }}</span>
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

    <div class="drawPile center"
        data-card-pile="draw"
        @click="showCardPile('draw')">
        抽排堆：{{ drawNum }}
    </div>
    <HandPile :class="{ 'hand-elevated': handCardSelectorActive }" data-card-pile="hand"></HandPile>
    <div class="discardPile center"
        data-card-pile="discard"
        @click="showCardPile('discard')">
        弃牌堆: {{ pileNum.discard }}
    </div>
    <div class="exhaustPile center"
        data-card-pile="exhaust"
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
    import HandCardSelector from '@/ui/components/interaction/HandCardSelector.vue';
    import { handCardSelectorActive } from '@/ui/hooks/interaction/handCardSelector';
    import { waitForPlayFlightIdle } from '@/ui/animation/cardFlight';

    const emit = defineEmits<{
        'battle-end': [result: 'player_win' | 'player_lose']
    }>()

    const hasEmitted = ref(false)
    const endTurnQueued = ref(false)

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
        return nowBattle.value?.nowTurn === "player"
            && !nowBattle.value?.isTurnTransitioning   // 回合交接期间按钮立刻置灰，不等 nowTurn 翻面
            && !handCardSelectorActive.value
            && !endTurnQueued.value
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
        endTurnQueued.value = true
        try {
            await waitForPlayFlightIdle()
            await nowBattle.value?.endPlayerTurnAndStartEnemyTurn()
        } finally {
            endTurnQueued.value = false
        }
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
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    width: max-content;
    min-width: var(--layout-energy-size);
    height: max-content;
    min-height: var(--layout-energy-size);
    padding: 4px 8px;
    box-sizing: border-box;
    white-space: nowrap;
    font-size: var(--layout-pile-font);
    position: absolute;
    left: var(--layout-energy-left);
    bottom: var(--layout-energy-bottom);
    z-index: 100;
}
.endTurn{
    width: var(--layout-end-turn-width);
    min-width: max-content;
    height: var(--layout-end-turn-height);
    padding: 0 12px;
    box-sizing: border-box;
    white-space: nowrap;
    position: absolute;
    right: var(--layout-end-turn-right);
    bottom: var(--layout-end-turn-bottom);
    z-index: 100;
    background: #f0f0f0;
    border: 2px solid black;
    cursor: pointer;
    font-weight: bold;
    font-size: var(--layout-pile-font);
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
    height: var(--layout-hand-height);
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - var(--layout-hand-side-gap));
}
.drawPile,
.discardPile,
.exhaustPile{
    width: max-content;
    min-width: var(--layout-pile-size);
    height: max-content;
    min-height: var(--layout-pile-size);
    padding: 4px 8px;
    box-sizing: border-box;
    white-space: nowrap;
    font-size: var(--layout-pile-font);
    position: absolute;
    z-index: 100;
}
.drawPile{
    left: var(--layout-draw-left);
    bottom: var(--layout-draw-bottom);
}
.discardPile{
    right: var(--layout-discard-right);
    bottom: var(--layout-discard-bottom);
}
.exhaustPile{
    right: var(--layout-exhaust-right);
    bottom: var(--layout-exhaust-bottom);
}
</style>
