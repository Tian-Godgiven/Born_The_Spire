<template>
<div class="relics-bar" :class="{ dragging: isDragging }">
    <div
        class="relics-arrow left"
        :class="{ disabled: !canScrollLeft }"
        v-show="needsScroll"
        @click="scrollByPage(-1)"
    >←</div>
    <div
        ref="trackRef"
        class="relics-track"
        @scroll="updateScroll"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endPointer"
        @pointercancel="endPointer"
        @click.capture="onClickCapture"
    >
        <Relic v-for="relic in relics" :relic="relic" :key="relic.key" />
    </div>
    <div
        class="relics-arrow right"
        :class="{ disabled: !canScrollRight }"
        v-show="needsScroll"
        @click="scrollByPage(1)"
    >→</div>
</div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Relic from '@/ui/components/object/Relic.vue'
import type { Relic as RelicType } from '@/core/objects/item/Subclass/Relic'

const props = defineProps<{
    relics: RelicType[]
}>()

const trackRef = ref<HTMLElement>()
const needsScroll = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isDragging = ref(false)
const didDrag = ref(false)

const DRAG_THRESHOLD = 4
let pointerDown = false
let dragStartX = 0
let dragStartScroll = 0
let resizeObserver: ResizeObserver | undefined

function updateScroll() {
    const el = trackRef.value
    if (!el) {
        needsScroll.value = false
        canScrollLeft.value = false
        canScrollRight.value = false
        return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    needsScroll.value = maxScroll > 1
    canScrollLeft.value = el.scrollLeft > 1
    canScrollRight.value = el.scrollLeft < maxScroll - 1
}

function scrollByPage(direction: number) {
    const el = trackRef.value
    if (!el) return
    const amount = Math.max(160, Math.floor(el.clientWidth * 0.6))
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
}

function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return
    const el = trackRef.value
    if (!el) return
    pointerDown = true
    didDrag.value = false
    dragStartX = event.clientX
    dragStartScroll = el.scrollLeft
}

function onPointerMove(event: PointerEvent) {
    if (!pointerDown) return
    const el = trackRef.value
    if (!el) return
    const dx = event.clientX - dragStartX
    if (!didDrag.value && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!didDrag.value) {
        didDrag.value = true
        isDragging.value = true
        el.setPointerCapture(event.pointerId)
    }
    el.scrollLeft = dragStartScroll - dx
}

function endPointer() {
    pointerDown = false
    isDragging.value = false
}

function onClickCapture(event: MouseEvent) {
    if (!didDrag.value) return
    event.preventDefault()
    event.stopPropagation()
    didDrag.value = false
}

function onWheel(event: WheelEvent) {
    const el = trackRef.value
    if (!el || !needsScroll.value) return
    const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY
    if (delta === 0) return
    event.preventDefault()
    el.scrollLeft += delta
}

watch(() => props.relics.length, async () => {
    await nextTick()
    updateScroll()
})

onMounted(async () => {
    await nextTick()
    const el = trackRef.value
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => updateScroll())
        resizeObserver.observe(el)
    }
    updateScroll()
})

onBeforeUnmount(() => {
    trackRef.value?.removeEventListener('wheel', onWheel)
    resizeObserver?.disconnect()
})
</script>

<style scoped lang="scss">
.relics-bar {
    position: absolute;
    left: 0;
    right: 0;
    top: var(--running-top-height, 8vh);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    box-sizing: border-box;
    z-index: 100;
    user-select: none;

    &.dragging {
        cursor: grabbing;

        :deep(.relic) {
            cursor: grabbing;
        }
    }
}

.relics-track {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    overflow-x: auto;
    overflow-y: hidden;
    cursor: grab;
    scrollbar-width: none;


    &::-webkit-scrollbar {
        display: none;
    }

    :deep(.relic) {
        flex-shrink: 0;
    }
}

.relics-arrow {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: 2px solid black;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;

    &:hover:not(.disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.disabled {
        opacity: 0.3;
        cursor: default;
        pointer-events: none;
    }
}
</style>
