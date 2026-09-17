<template>
<div class="top-container">
    <div class="top-main">
            <div class="playerData">
            <div class="name">
                <div class="text">{{ nowPlayer.label }}</div>
                <div class="state">
                    <transition-group name="fade-in" tag="div">
                        <div class="stateText" :style="{color: value.color}" v-for="value in stateList" :key="value.text">
                            &nbsp;&nbsp;{{ value.text }}
                        </div>
                    </transition-group>
                </div>
            </div>
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
            <div>层数：{{ nowGameRun.towerLevel ?? 0 }}</div>
            <div v-if="ascensionUiEnabled">进阶：{{ nowGameRun.towerFire ?? 0 }}</div>
        </div>
        <div class="ability flex">
            <template v-for="ability in abilities" :key="ability.label">
                <div v-if="ability.pile" :data-card-pile="ability.pile">
                    <Button :click="ability.click" :label="ability.label"/>
                </div>
                <Button v-else :click="ability.click" :label="ability.label"/>
            </template>
        </div>
    </div>

    <RelicBar v-if="relics.length > 0" :relics="relics" />

    <Teleport to="body">
        <div
            v-if="showOptions"
            class="option-overlay"
            :style="{ zIndex: SHOW_POPUP_Z_INDEX }"
            @click.self="showOptions = false"
        >
            <div class="option-bar">
                <Button large :click="openSettingsFromOptions" label="设置"/>
                <Button large :click="confirmEndRun" label="回到标题页"/>
                <Button large :click="closeOptions" label="返回"/>
            </div>
        </div>
    </Teleport>

    <SettingsModal v-if="showSettings" @close="showSettings = false" />
</div>
</template>

<script setup lang='ts'>
    import { endRun, nowGameRun, nowPlayer } from '@/core/objects/game/run';
    import { computed, ref } from 'vue';
    import Button from "@/ui/components/global/Button.vue"
    import SettingsModal from "@/ui/components/interaction/SettingsModal.vue"
    import ReserveDisplay from "@/ui/components/display/ReserveDisplay.vue"
    import PotionVue from "@/ui/components/object/Potion.vue"
    import RelicBar from "./RelicBar.vue"
    import { showCardGroup } from '@/ui/hooks/interaction/cardGroupModal';
    import { getStatusValue } from '@/core/objects/system/status/Status';
    import type { Potion } from '@/core/objects/item/Subclass/Potion';
    import { getPotionModifier } from '@/core/objects/system/modifier/PotionModifier';
    import { markRegistry } from '@/static/registry/markRegistry';
    import { getShowMapCallback } from '@/core/hooks/step';
    import { getCardModifier } from '@/core/objects/system/modifier/CardModifier';
    import type { CardPileName } from '@/ui/animation/cardFlight';
    import { ASCENSION_UI_ENABLED } from '@/static/list/system/ascensionList';
    import { SHOW_POPUP_Z_INDEX, dismissAllPopovers } from '@/ui/hooks/interaction/popoverHost';
    import { showConfirm } from '@/ui/hooks/interaction/confirmModal';

    // 打开地图（用于战斗中查看地图）
    function openMap() {
        const showMapCallback = getShowMapCallback()
        if (showMapCallback) {
            showMapCallback()
        } else {
            console.warn('[Top] 地图回调未注册')
        }
    }

    // 打开卡组弹窗
    function showDeck() {
        const cardModifier = getCardModifier(nowPlayer)
        const allCards = cardModifier.getAllCards()
        showCardGroup('卡组', allCards)
    }

    const health = computed(()=>{
        // 检查 nowPlayer 是否已初始化
        if (!nowPlayer || typeof nowPlayer.getHealth !== 'function') {
            return { now: 0, max: 0 }
        }
        return nowPlayer.getHealth()
    })

    const stateList = computed(() => {
        const states: Array<{text: string, color: string}> = []

        // 检查 nowPlayer 是否已初始化
        if (!nowPlayer || !nowPlayer.status) {
            return states
        }

        // 遍历所有注册的印记，动态显示
        const allMarks = markRegistry.getAllMarks()
        for (const mark of allMarks) {
            // 检查玩家是否拥有该印记
            if (getStatusValue(nowPlayer, mark.statusKey, 0) === 1) {
                states.push({
                    text: mark.displayText,
                    color: mark.displayColor
                })
            }
        }

        return states
    })

    const potions = computed(() => {
        // 检查 nowPlayer 是否已初始化（检查是否有 status 属性）
        if (!nowPlayer || !nowPlayer.status) {
            return []
        }
        const maxNum = Number(getStatusValue(nowPlayer, "max-potion"))
        const potionModifier = getPotionModifier(nowPlayer)
        const list: (Potion | null)[] = [...potionModifier.potions.value]
        while (list.length < maxNum) {
            list.push(null)
        }
        return list
    })

    const showSettings = ref(false)
    const showOptions = ref(false)
    const ascensionUiEnabled = ASCENSION_UI_ENABLED

    function openOptions() {
        dismissAllPopovers()
        showOptions.value = true
    }

    function closeOptions() {
        showOptions.value = false
    }

    function openSettingsFromOptions() {
        showOptions.value = false
        showSettings.value = true
    }

    async function confirmEndRun() {
        showOptions.value = false
        const confirmed = await showConfirm(
            "回到标题页",
            "目前没有存档系统，回到标题页后本局进度会丢失。"
        )
        if (confirmed) endRun()
    }

    const abilities: Array<{ label: string, click: () => void, pile?: CardPileName }> = [
        {label:"地图",click:()=>openMap()},
        {label:"卡组",click:()=>showDeck(), pile: "deck"},
        {label:"选项",click:()=>openOptions()}
    ]

    const relics = computed(() => nowPlayer?.getRelicsList() ?? [])

</script>

<style scoped lang='scss'>
.top-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-bottom: 2px solid black;
}
.top-main{
    flex: 1;
    min-height: 0;
    display: grid;
    align-items: center;
    grid-template-columns: 4fr 2fr 1fr;
    .playerData{
        display: grid;
        grid-template-columns: repeat(4,1fr);
        align-items: center;
    }
    .gameRunData{
        display: flex;
        align-items: center;
        gap: var(--layout-gap-md);
    }
}
.name{
    display: flex;
    align-items: center;
    .text{

    }
}
.flex{
    display: flex;
    align-items: center;
    >div{
        flex-shrink: 0;
    }
}
.ability{
    justify-content: flex-end;
    gap: var(--layout-gap-sm);
}
.potions{
    gap: 10px;
}

.option-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.option-bar {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--layout-gap-md);
    width: min(420px, 80vw);

    :deep(.game-btn) {
        width: 100%;
        font-size: 22px;

        .game-btn-face {
            background: #fff;
            padding: 16px 28px;
        }
    }
}

/* 渐显动画 */
.fade-in-enter-active {
    animation: fadeIn 2s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>