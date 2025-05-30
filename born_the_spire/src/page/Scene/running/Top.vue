<template>
<div class="top">
    <div class="playerData">
        <div class="name">{{ nowPlayer.label }}</div>
        <div class="health">
            生命：
            {{ health.now }} / 
            {{ health.max }}
        </div>
        <div class="moneys">
            <div v-for="money in moneys">
                {{ money.label+"："+money.num }}
            </div>
        </div>
        <div class="potions flex">
            <div v-for="potion in potions" >
                <div v-if="potion">{{ potion.label }}</div>
                <div v-else>[空]</div>
            </div>
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
    import { endRun, nowGameRun, nowPlayer } from '@/hooks/run';
    import { computed } from 'vue';
    import Button from "@/components/global/Button.vue"
    import { changeScene } from "@/hooks/changeScene";
import { showCardGroup } from '@/hooks/popUp';
import { getStatusByKey } from '@/objects/system/Status';
    const health = computed(()=>{
        const status = getStatusByKey(nowPlayer.value,"health","max")
        return {
            now:status.value.now,
            max:status.value.max
        }
    })
    const moneys = computed(()=>{
        return nowPlayer.value.getNowMoneys()
    })
    const potions = computed(()=>{
        return nowPlayer.value.getPotionList()
    })
    const abilities = [
        {label:"地图",click:()=>changeScene("map")},
        {label:"卡组",click:()=>showCardGroup()},
        {label:"返回",click:()=>endRun()}
    ]

</script>

<style scoped lang='scss'>
.top{
    display: grid;
    min-height: 50px;
    height: 8vh;
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
</style>