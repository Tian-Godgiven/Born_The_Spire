<template>
<div class="top">
    <div class="playerData">
        <div class="name">{{ nowPlayer.label }}</div>
        <div class="health">
            生命：
            {{ health.now }} /
            {{ health.max }}
        </div>
        <ReserveDisplay :player="nowPlayer" />
        <div class="potions flex">
            <PotionVue
                v-for="(potion, index) in potions"
                :key="index"
                :potion="potion"
            />
        </div>
    </div>

    <div class="gameRunData">
        <div>层数：{{ nowGameRun.towerLevel }}</div>
        <div>进阶：{{ nowGameRun.towerFire }}</div>
    </div>
    <div class="ability flex">
        <Button v-for="ability in abilities"
            :click="ability.click"
            :label="ability.label"/>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { endRun, nowGameRun, nowPlayer } from '@/core/objects/game/run';
    import { computed } from 'vue';
    import Button from "@/ui/components/global/Button.vue"
    import ReserveDisplay from "./components/ReserveDisplay.vue"
    import PotionVue from "@/ui/components/object/Potion.vue"
    import { changeScene } from "@/ui/interaction/scene";
    import { showCardPile } from '@/ui/interaction/cardPile';
    import { getStatusValue } from '@/core/objects/system/status/Status';
    import type { Potion } from '@/core/objects/item/Subclass/Potion';
    import { getPotionModifier } from '@/core/objects/system/modifier/PotionModifier';

    const health = computed(()=>{
        return nowPlayer.getHealth()
    })

    const potions = computed(() => {
        const maxNum = getStatusValue(nowPlayer, "max-potion")
        const potionModifier = getPotionModifier(nowPlayer)
        const list: (Potion | null)[] = [...potionModifier.potions.value]
        while (list.length < maxNum) {
            list.push(null)
        }
        return list
    })

    const abilities = [
        {label:"地图",click:()=>changeScene("map")},
        {label:"卡组",click:()=>showCardPile()},
        {label:"返回",click:()=>endRun()}
    ]

</script>

<style scoped lang='scss'>
.top{
    display: grid;
    align-items: center;
    grid-template-columns: 4fr 2fr 1fr;
    border-bottom: 2px solid black;
    .playerData{
        display: grid;
        grid-template-columns: repeat(4,1fr);
    }
    .gameRunData{
        display: grid;
        grid-template-columns: repeat(2,1fr);
    }
}
.flex{
    display: flex;
    align-items: center;
    >div{
        flex-shrink: 0;
    }
}
.potions{
    gap: 10px;
}
</style>