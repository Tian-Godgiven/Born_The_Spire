<template>
<span ref="elRef" class="describe-fx">{{ visibleText }}</span>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue"
import { settings } from "@/core/persistence/settings"
import { isAnimationCategoryEnabled } from "@/ui/animation/categories"
import {
    getDescribeFx,
    playDescribeFxMotions,
} from "@/ui/animation/describeFx"
import { DEFAULT_BEAT_CHAR } from "@/ui/hooks/express/describe"

const {
    text,
    fxKeys,
    beatStart = 0,
    beatChar = DEFAULT_BEAT_CHAR,
} = defineProps<{
    text: string
    fxKeys: string[]
    beatStart?: number
    beatChar?: number
}>()

const elRef = ref<HTMLElement | null>(null)
const elapsed = ref(0)
let beatRaf = 0
let stopMotions: (() => void) | null = null

function fxAllowed(key: string): boolean {
    if (settings.skipAnimation) return false
    const def = getDescribeFx(key)
    if (!def) return false
    if (def.category && !isAnimationCategoryEnabled(def.category)) return false
    return true
}

const revealOn = computed(() =>
    fxKeys.some(key => getDescribeFx(key)?.kind === "reveal" && fxAllowed(key))
)

const motionKeys = computed(() =>
    fxKeys.filter(key => getDescribeFx(key)?.kind === "motion" && fxAllowed(key))
)

const visibleText = computed(() => {
    if (!revealOn.value) return text
    const start = beatStart
    const char = beatChar > 0 ? beatChar : DEFAULT_BEAT_CHAR
    if (elapsed.value < start) return ""
    const shown = Math.floor((elapsed.value - start) / char) + 1
    return Array.from(text).slice(0, shown).join("")
})

function stopBeatClock() {
    if (beatRaf) {
        cancelAnimationFrame(beatRaf)
        beatRaf = 0
    }
}

function startBeatClock() {
    stopBeatClock()
    if (!revealOn.value) {
        elapsed.value = Number.POSITIVE_INFINITY
        return
    }
    const speed = Number(settings.animationSpeed) || 1
    const char = beatChar > 0 ? beatChar : DEFAULT_BEAT_CHAR
    const end = beatStart + Array.from(text).length * char
    const t0 = performance.now()
    const tick = () => {
        elapsed.value = ((performance.now() - t0) / 1000) * speed
        if (elapsed.value < end) {
            beatRaf = requestAnimationFrame(tick)
        } else {
            elapsed.value = end
            beatRaf = 0
        }
    }
    elapsed.value = 0
    beatRaf = requestAnimationFrame(tick)
}

function restartMotions() {
    stopMotions?.()
    stopMotions = null
    const el = elRef.value
    if (!el || motionKeys.value.length === 0) return
    const speed = Number(settings.animationSpeed) || 1
    stopMotions = playDescribeFxMotions(el, motionKeys.value, speed)
}

watch([revealOn, () => text, () => beatStart, () => beatChar], () => startBeatClock(), { immediate: true })
watch([elRef, motionKeys, () => settings.animationSpeed], () => restartMotions(), { immediate: true })
onUnmounted(() => {
    stopBeatClock()
    stopMotions?.()
})
</script>

<style scoped lang="scss">
.describe-fx {
    display: inline-block;
}
</style>
