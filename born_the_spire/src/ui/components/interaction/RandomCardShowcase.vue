<template>
    <div class="random-card-showcase">
        <div class="narration">{{ narration }}</div>
        <div class="card-stage">
            <div ref="animRef" class="card-slot">
                <CardVue :card="card" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed, type PropType } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import CardVue from '@/ui/components/object/Card.vue'
import { useAnimation } from '@/ui/animation/useAnimation'

const props = defineProps({
    card: { type: Object as PropType<Card>, required: true },
    mode: { type: String as PropType<'remove' | 'duplicate'>, required: true },
    holdMs: { type: Number, default: 1000 }
})

const emit = defineEmits<{
    complete: []
}>()

const narration = computed(() => {
    if (props.mode === 'remove') return `你将献出这张卡：${props.card.label}`
    return `你将复制这张卡：${props.card.label}`
})

const { animRef, play } = useAnimation('random_card_showcase')

onMounted(async () => {
    const appear = await play('card_appear')
    await appear.promise

    await new Promise((r) => setTimeout(r, props.holdMs))

    const exitKey = props.mode === 'remove' ? 'card_ascend_fadeout' : 'card_duplicate_fadeout'
    const exit = await play(exitKey)
    await exit.promise

    emit('complete')
})
</script>

<style scoped lang="scss">
.random-card-showcase {
    width: 420px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .narration {
        font-size: 18px;
        text-align: center;
        color: #222;
    }

    .card-stage {
        width: 100%;
        height: 240px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
    }

    .card-slot {
        display: inline-block;
        transform-origin: center center;
        will-change: transform, opacity, filter;
    }
}
</style>
