<template>
<div class="battle">
    <BattleView @battle-end="onBattleEnd" />
    <RewardPage />
</div>
</template>

<script setup lang='ts'>

    import BattleView from './BattleView.vue';
    import RewardPage from '@/ui/components/interaction/RewardPage.vue';
    import { nowGameRun } from '@/core/objects/game/run';

    async function onBattleEnd(result: 'player_win' | 'player_lose') {
        if (result === 'player_win') {
            await nowGameRun.completeCurrentRoom()
        }
    }

</script>

<style scoped lang='scss'>
.battle{
    position: relative;
    height: 100%;
    width: 100%;
    flex-grow: 1;
}
</style>
