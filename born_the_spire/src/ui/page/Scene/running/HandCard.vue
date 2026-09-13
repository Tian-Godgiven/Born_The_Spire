<template>
<ChooseSource
    :onSuccess
    :onStop="onChooseStop"
    :onHover="handleHover"
    :key="card.__id"
    ref="chooseSource"
    :disable-scale="true"
    class="hand-card-wrapper"
    :class="{ aiming, armed, 'click-selected': clickSelected }"
    :style="aimStyle"
    @click="handleClick"
    @pointerdown="handlePointerDown"
    @contextmenu.prevent="handleContextMenu"
>
    <CardVue :class="{disabled: card.isDisabled}" :card="card" :hoverTarget="hoverTarget"/>
</ChooseSource>
</template>

<script setup lang='ts'>
    import { useCard } from '@/core/objects/item/Subclass/Card';
    import type { Card } from "@/core/objects/item/Subclass/Card"
    import CardVue from '@/ui/components/object/Card.vue';
    import ChooseSource from '@/ui/components/interaction/chooseTarget/ChooseSource.vue';
    import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, type PropType } from 'vue';
    import { nowPlayer } from '@/core/objects/game/run';
    import { mousePosition } from '@/ui/hooks/global/mousePosition';
    import { Target } from '@/core/objects/target/Target';
    import { handCardSelectorActive, toggleCardSelection } from '@/ui/hooks/interaction/handCardSelector';
    import { getCardModifier } from '@/core/objects/system/modifier/CardModifier';
    import { getStatusValue } from '@/core/objects/system/status/Status';
    import { getCurrentValue } from '@/core/objects/system/Current/current';
    import { choosingTarget, endChooseTarget } from '@/ui/interaction/target/chooseTarget';
    import {
        aimingHandCardId,
        ARM_DISTANCE_PX,
        LIFT_PX,
        cancelAimedPlay,
        clampTilt,
        clearAimHover,
        confirmAimedPlay,
        distanceFrom,
        hitAimDrop,
        swallowNextClick,
        syncAimHover
    } from '@/ui/hooks/interaction/handCardAim';

    const { card } = defineProps({
        card: { type: Object as PropType<Card>, required: true }
    })

    const chooseSourceRef = useTemplateRef("chooseSource")
    const hoverTarget = shallowRef<Target | undefined>(undefined)

    const selectorActive = handCardSelectorActive

    const aiming = ref(false)
    const armed = ref(false)
    const clickSelected = ref(false)
    let originX = 0
    let originY = 0
    let pointerId: number | null = null
    const rotateDeg = ref(0)
    const aimStyle = computed(() => {
        if (!aiming.value && !clickSelected.value) return undefined
        return {
            transform: `translateY(-${LIFT_PX}px) rotate(${rotateDeg.value}deg)`,
            zIndex: 300
        }
    })

    function canAimCard(): boolean {
        if (selectorActive.value) return false
        if (card.isDisabled) return false
        if (!card.getInteraction("use")) return false
        const canPlay = getCardModifier(nowPlayer).canPlayCard(card)
        if (canPlay !== true) return false
        const cost = getStatusValue(card, "cost")
        if (cost === null) return false
        if (getCurrentValue(nowPlayer, "energy", 0) < Number(cost ?? 0)) return false
        return true
    }

    function startTargeting() {
        if (!chooseSourceRef.value) return
        const interaction = card.getInteraction("use")
        if (!interaction) return
        if (choosingTarget.value) endChooseTarget()
        chooseSourceRef.value.startChoose({
            targetType: interaction.target,
            source: nowPlayer.getSelf(),
            ifShowConnectLine: true
        })
    }

    function setArmed(next: boolean) {
        if (armed.value === next) return
        armed.value = next
        if (next) startTargeting()
        else cancelAimedPlay()
    }

    function updateAimFromPointer(clientX: number, clientY: number) {
        mousePosition.left = clientX
        mousePosition.top = clientY
        rotateDeg.value = clampTilt(clientX - originX)
        const farEnough = distanceFrom(clientX, clientY, originX, originY) >= ARM_DISTANCE_PX
        setArmed(farEnough)
        const drop = hitAimDrop(clientX, clientY)
        syncAimHover(drop)
        hoverTarget.value = drop.kind === "target" ? drop.target : undefined
    }

    function stopAimListeners() {
        window.removeEventListener("pointermove", onWindowPointerMove)
        window.removeEventListener("pointerup", onWindowPointerUp)
        window.removeEventListener("pointercancel", onWindowPointerUp)
    }

    function onWindowPointerMove(event: PointerEvent) {
        if (event.pointerId !== pointerId) return
        updateAimFromPointer(event.clientX, event.clientY)
    }

    function onWindowPointerUp(event: PointerEvent) {
        if (pointerId === null || event.pointerId !== pointerId) return
        const wasAiming = aiming.value
        const wasArmed = armed.value
        const drop = hitAimDrop(event.clientX, event.clientY)
        stopAim()
        if (!wasAiming) return
        swallowNextClick()
        if (wasArmed) {
            clearClickSelect()
            confirmAimedPlay(drop)
        } else {
            startTargeting()
            clickSelected.value = true
            startClickSway()
        }
    }

    function stopAim() {
        stopAimListeners()
        pointerId = null
        aiming.value = false
        armed.value = false
        clearAimHover()
        if (aimingHandCardId.value === card.__id) aimingHandCardId.value = null
        hoverTarget.value = undefined
    }

    function onClickSwayMove(event: PointerEvent) {
        rotateDeg.value = clampTilt(event.clientX - originX)
    }

    function startClickSway() {
        window.addEventListener("pointermove", onClickSwayMove)
        rotateDeg.value = clampTilt(mousePosition.left - originX)
    }

    function stopClickSway() {
        window.removeEventListener("pointermove", onClickSwayMove)
    }

    function clearClickSelect() {
        stopClickSway()
        clickSelected.value = false
        rotateDeg.value = 0
        hoverTarget.value = undefined
    }

    function handlePointerDown(event: PointerEvent) {
        if (selectorActive.value) return
        if (event.button !== 0) return
        event.preventDefault()
        if (!canAimCard()) return
        stopClickSway()
        const el = event.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        originX = rect.left + rect.width / 2
        originY = rect.top + rect.height / 2
        pointerId = event.pointerId
        aiming.value = true
        aimingHandCardId.value = card.__id
        try {
            el.setPointerCapture(event.pointerId)
        } catch {
            // 部分环境不支持 capture，窗口监听仍能跟上
        }
        window.addEventListener("pointermove", onWindowPointerMove)
        window.addEventListener("pointerup", onWindowPointerUp)
        window.addEventListener("pointercancel", onWindowPointerUp)
        updateAimFromPointer(event.clientX, event.clientY)
    }

    function handleClick() {
        if (selectorActive.value) {
            if ((card as any)._chooseAble) {
                toggleCardSelection(card)
            }
            return
        }
    }

    function handleContextMenu() {
        if (aiming.value) {
            stopAim()
            cancelAimedPlay()
            return
        }
        if (clickSelected.value || choosingTarget.value) {
            cancelAimedPlay()
            clearClickSelect()
        }
    }

    function handleHover(target?: Target){
        if (aiming.value) return
        hoverTarget.value = target
    }

    function onChooseStop() {
        clearClickSelect()
    }

    async function onSuccess(targets:Target[]){
        clearClickSelect()
        if (card.isDisabled) {
            return
        }
        await useCard(card,nowPlayer.cardPiles.handPile,nowPlayer.getSelf(),targets);
        hoverTarget.value = undefined
    }

    onBeforeUnmount(() => {
        stopAim()
        clearClickSelect()
    })
</script>

<style scoped lang='scss'>
.hand-card-wrapper {
    position: relative;
    z-index: 10;
    touch-action: none;
    user-select: none;
    transform-origin: center bottom;
    transition: transform 0.2s ease-out;

    &:hover:not(.aiming):not(.click-selected),
    &.hovering:not(.aiming):not(.click-selected) {
        transform: scale(1.08);
        z-index: 200;
    }

    &.aiming,
    &.click-selected {
        z-index: 300;
    }

    &.armed,
    &.click-selected {
        box-shadow: 0 0 14px 2px rgb(0, 0, 0);
    }
}

.disabled{
    filter: grayscale(100%);
    opacity: 0.6;
}
</style>
