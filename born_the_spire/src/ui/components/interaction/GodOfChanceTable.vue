<template>
<div class="god-of-chance">
    <div class="board">
        <div class="die">{{ topShow }}</div>
        <div class="die">{{ bottomShow }}</div>
    </div>

    <div class="panel">
        <div class="panel-top">
            <div class="event-header">
                <h1 class="event-title">{{ eventTitle }}</h1>
            </div>

            <div class="event-description">
                <p>
                    <template v-for="(line, i) in descriptionLines" :key="i">
                        <br v-if="i > 0">{{ line }}
                    </template>
                </p>
                <p
                    class="prompt-line"
                    :class="{ 'is-in': showOffer, instant: skipMotion() }"
                >{{ promptLine }}</p>
            </div>

            <div
                class="stakes"
                :class="{ 'is-in': showOffer, instant: skipMotion() }"
            >
                <div class="stake" :class="{ 'is-hit': hitKind === 'win', instant: skipMotion() }">
                    <span class="stake-ink"></span>
                    <div class="stake-name">奖励</div>
                    <div class="stake-value">{{ winLabel }}</div>
                </div>
                <div class="stake" :class="{ 'is-hit': hitKind === 'lose', instant: skipMotion() }">
                    <span class="stake-ink"></span>
                    <div class="stake-name">惩罚</div>
                    <div class="stake-value">{{ loseLabel }}</div>
                </div>
            </div>
        </div>

        <div class="event-options">
            <div
                v-for="choice in choices"
                :key="choice.__key"
                class="event-option"
                :class="{
                    'option-available': !acting && choice.isAvailable(),
                    'option-disabled': acting || !choice.isAvailable()
                }"
                @click="handleOptionClick(choice)"
            >
                <div class="option-content">
                    <div class="option-title">{{ choice.title }}</div>
                    <div v-if="choice.getDescription()" class="option-description">
                        {{ choice.getDescription() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { nowGameRun } from "@/core/objects/game/run"
import { EventRoom } from "@/core/objects/room/EventRoom"
import type { Choice } from "@/core/objects/system/Choice"
import { eventEffectMap } from "@/static/list/room/event/eventEffectMap"
import { godOfChanceIsHouseFirst, godOfChancePromptLine, godOfChanceTableText } from "@/static/list/room/event/godOfChance"
import { isAnimationCategoryEnabled } from "@/ui/animation/categories"
import { settings } from "@/core/persistence/settings"

const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    return room instanceof EventRoom ? room : null
})

const data = computed(() => currentRoom.value?.getSceneData() ?? {})

const eventTitle = computed(() => currentRoom.value?.currentTitle || "无常之神")

const descriptionText = computed(() => godOfChanceTableText(data.value))

const descriptionLines = computed(() =>
    descriptionText.value.split(/\s*\/br\/\s*/).filter(line => line.length > 0)
)

const promptLine = computed(() => godOfChancePromptLine(data.value))

const showOffer = computed(() => {
    const scene = data.value
    if (scene.resolved && (scene.round ?? 1) >= 6) return false
    const round = scene.round ?? 1
    if (!godOfChanceIsHouseFirst(round)) return true
    return !!scene.houseRevealed
})

const winLabel = computed(() => data.value.winLabel || "……")
const loseLabel = computed(() => data.value.loseLabel || "……")

const choices = computed(() => currentRoom.value?.choiceGroup.choices || [])

const topShow = ref("?")
const bottomShow = ref("?")
const acting = ref(false)
const hitKind = ref<"win" | "lose" | null>(null)

let topFlicker: number | undefined
let bottomFlicker: number | undefined
let setupGen = 0
let unmounted = false

function skipMotion(): boolean {
    return settings.skipAnimation === true || !isAnimationCategoryEnabled("ui")
}

function motionDelay(ms: number): number {
    if (skipMotion()) return 0
    const speed = Number(settings.animationSpeed)
    return ms / (Number.isFinite(speed) && speed > 0 ? speed : 1)
}

function sleep(ms: number): Promise<void> {
    const wait = motionDelay(ms)
    if (wait <= 0) return Promise.resolve()
    return new Promise(resolve => setTimeout(resolve, wait))
}

function randomPip(): string {
    return String(Math.floor(Math.random() * 10) + 1)
}

function startFlicker(which: "top" | "bottom") {
    stopFlicker(which)
    const tick = () => {
        if (which === "top") topShow.value = randomPip()
        else bottomShow.value = randomPip()
    }
    tick()
    const id = window.setInterval(tick, 90)
    if (which === "top") topFlicker = id
    else bottomFlicker = id
}

function stopFlicker(which: "top" | "bottom") {
    if (which === "top" && topFlicker != null) {
        clearInterval(topFlicker)
        topFlicker = undefined
    }
    if (which === "bottom" && bottomFlicker != null) {
        clearInterval(bottomFlicker)
        bottomFlicker = undefined
    }
}

function land(which: "top" | "bottom", face: number) {
    stopFlicker(which)
    if (which === "top") topShow.value = String(face)
    else bottomShow.value = String(face)
}

function rollBoth() {
    startFlicker("top")
    startFlicker("bottom")
}

async function setupRound() {
    const gen = ++setupGen
    const scene = data.value
    acting.value = false
    hitKind.value = null
    if (scene.resolved || scene.busy) return

    stopFlicker("top")
    stopFlicker("bottom")
    await nextTick()
    if (unmounted || gen !== setupGen) return

    try {
        rollBoth()
        const round = scene.round ?? 1
        if (godOfChanceIsHouseFirst(round) && !scene.houseRevealed && scene.houseFace != null) {
            await sleep(round === 1 ? 1400 : 2800)
            if (unmounted || gen !== setupGen) return
            land("top", scene.houseFace)
            scene.houseRevealed = true
        }
    } catch (error) {
        console.error("[GodOfChanceTable] 开局失败:", error)
    }
}

function isStopChoice(choice: Choice): boolean {
    const key = choice.__key
    return key === "roll_continue" || key === "roll_final"
}

async function playStopSequence() {
    const scene = data.value
    const round = scene.round ?? 1
    scene.playerFace = await eventEffectMap["godOfChance_rollPlayer"]({ round })
    land("bottom", scene.playerFace)
    if (unmounted) return
    if (!godOfChanceIsHouseFirst(round)) {
        await sleep(2200)
        if (unmounted) return
        scene.houseFace = await eventEffectMap["godOfChance_rollHouse"]({ round })
        land("top", scene.houseFace)
        if (unmounted) return
        scene.houseRevealed = true
    }
    scene.playerRevealed = true
}

async function handleOptionClick(choice: Choice) {
    if (acting.value || !choice.isAvailable() || !currentRoom.value) return
    try {
        if (isStopChoice(choice)) {
            acting.value = true
            await playStopSequence()
            if (unmounted) return
            const won = Number(data.value.playerFace) > Number(data.value.houseFace)
            hitKind.value = won ? "win" : "lose"
            await nextTick()
            await sleep(1600)
            if (unmounted) return
        }
        await currentRoom.value.choiceGroup.selectChoice(choice)
    } catch (error) {
        console.error("[GodOfChanceTable] 选择失败:", error)
        acting.value = false
        data.value.busy = false
    }
}

onMounted(() => {
    void nextTick(() => setupRound())
})

watch(
    () => data.value.dealId,
    (id, prev) => {
        if (prev === undefined) return
        if (id == null) return
        void setupRound()
    }
)

onBeforeUnmount(() => {
    unmounted = true
    stopFlicker("top")
    stopFlicker("bottom")
})
</script>

<style scoped lang="scss">
.god-of-chance {
    width: auto;
    height: 500px;
    display: flex;
    gap: 1.5rem;
    align-items: stretch;
}

.board {
    width: 500px;
    height: 500px;
    box-sizing: border-box;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
    border: 2px solid black;
    padding: 2rem;
    background: white;
}

.die {
    width: 88px;
    height: 88px;
    border: 2px solid black;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    font-weight: bold;
    user-select: none;
}

.panel {
    width: 400px;
    height: 500px;
    box-sizing: border-box;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.panel-top {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.event-header {
    text-align: left;
    border-bottom: 2px solid black;
    padding-bottom: 0.6rem;
}

.event-title {
    font-size: 1.35rem;
    margin: 0;
    font-weight: bold;
}

.event-description {
    text-align: left;
    padding: 0.15rem 0;
}

.event-description p {
    font-size: 0.98rem;
    margin: 0;
    line-height: 1.55;
}

.prompt-line {
    margin-top: 0.55rem;
    opacity: 0;
    transition: opacity 0.8s ease;
}

.prompt-line:empty {
    margin-top: 0;
}

.prompt-line.instant,
.stakes.instant {
    transition: none;
}

.stakes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.8s ease;
}

.stakes.is-in {
    opacity: 1;
}

.stake {
    position: relative;
    overflow: hidden;
    border: 2px solid black;
    padding: 0.55rem 0.85rem;
    display: flex;
    gap: 0.85rem;
    align-items: baseline;
    background: white;
}

.stake-ink {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 0;
    background: black;
    transform: translateX(-50%);
    pointer-events: none;
}

.stake.is-hit .stake-ink {
    animation: stake-ink-expand 0.8s ease-in-out forwards;
}

.stake.is-hit.instant .stake-ink {
    animation: none;
    width: 100%;
}

.stake.is-hit .stake-name,
.stake.is-hit .stake-value {
    position: relative;
    z-index: 1;
    color: white;
    mix-blend-mode: difference;
}

@keyframes stake-ink-expand {
    from { width: 0; }
    to { width: 100%; }
}

.stake-name {
    font-size: 0.95rem;
    font-weight: bold;
    min-width: 2.5em;
}

.stake-value {
    font-size: 0.95rem;
    line-height: 1.4;
}

.event-options {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.event-option {
    border: 2px solid black;
    background: white;
    cursor: pointer;

    &.option-available:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.option-disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.option-content {
    padding: 0.7rem 0.95rem;
}

.option-title {
    font-size: 1.05rem;
    font-weight: bold;
}

.option-description {
    font-size: 0.88rem;
    color: #666;
    line-height: 1.45;
    margin-top: 0.25rem;
}
</style>
