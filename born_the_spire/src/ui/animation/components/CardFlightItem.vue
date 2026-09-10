<template>
    <div
        class="card-flight-item"
        ref="animRef"
        :style="boxStyle"
    >
        <CardVue :card="card" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted } from "vue"
import type { Card } from "@/core/objects/item/Subclass/Card"
import type { CardFlightRect } from "@/ui/animation/cardFlight"
import { completeFlightJob, waitForPlayFinish, setFlightJobEnd, CARD_FLIGHT_TILT } from "@/ui/animation/cardFlight"
import { useAnimation } from "@/ui/animation/useAnimation"
import CardVue from "@/ui/components/object/Card.vue"

const props = defineProps<{
    id: string
    card: Card
    start: CardFlightRect
    hold: CardFlightRect | null
    end: CardFlightRect | null
    holdSec: number
    waitForFinish: boolean
    fromRot: number
    toRot: number
    scale: number
    vanish: boolean
    onHeld?: () => void
    onDone: () => void
}>()

const { animRef, play } = useAnimation(`card_flight_${props.id}`)

const boxStyle = computed(() => ({
    left: `${props.start.left}px`,
    top: `${props.start.top}px`,
    width: `${props.start.width}px`,
    height: `${props.start.height}px`,
}))

async function flyTo(
    target: CardFlightRect,
    hold: number,
    fromRot: number,
    toRot: number,
    scale: number,
    vanish = false,
) {
    const dx = target.left - props.start.left
    const dy = target.top - props.start.top
    const handle = await play("card_fly", { params: { dx, dy, hold, fromRot, toRot, scale, vanish } })
    await handle.promise
}

let waitingFinish = false

onBeforeUnmount(() => {
    if (waitingFinish) setFlightJobEnd(props.id, null)
})

onMounted(async () => {
    await nextTick()
    try {
        if (props.hold) {
            try {
                await flyTo(props.hold, props.holdSec, 0, 0, 1)
            } finally {
                props.onHeld?.()
            }
            if (props.waitForFinish) {
                waitingFinish = true
                const dest = await waitForPlayFinish(props.id)
                waitingFinish = false
                if (dest) await flyTo(dest, 0, 0, CARD_FLIGHT_TILT, 1, true)
                return
            }
        }
        if (props.end) {
            const vanish = props.vanish
            await flyTo(props.end, 0, props.fromRot, props.toRot, props.scale, vanish)
        }
    } finally {
        props.onDone()
        completeFlightJob(props.id)
    }
})
</script>

<style scoped lang="scss">
.card-flight-item {
    position: fixed;
    pointer-events: none;
    transform-origin: center center;
}
</style>
