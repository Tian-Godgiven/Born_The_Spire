<template>
<div class="card-detail" @click="close">
    <Mask />
    <div class="panel" @click.stop>
        <Card v-if="displayCard" :card="displayCard" />
        <label v-if="canToggle" class="forge-toggle">
            <input type="checkbox" v-model="showForged">
            显示锻造后的卡牌
        </label>
    </div>
</div>
</template>

<script setup lang='ts'>
    import { ref, shallowRef, watch } from 'vue'
    import type { Card as CardType } from '@/core/objects/item/Subclass/Card'
    import type { PopUp } from '@/ui/hooks/global/popUp'
    import { closePopUp } from '@/ui/hooks/global/popUp'
    import Mask from '@/ui/components/global/Mask.vue'
    import Card from '@/ui/components/object/Card.vue'
    import { canPreviewCardForge } from '@/core/effects/card/cardUpgrade'
    import { previewCardAtLevel } from '@/ui/hooks/express/cardSegment'

    const { popUp, props } = defineProps<{
        popUp: PopUp
        props: { card: CardType }
    }>()

    const source = props.card
    const canToggle = canPreviewCardForge(source)
    const showForged = ref(source.level > 0)
    const displayCard = shallowRef(source)
    let forgedPreview: CardType | null = null
    let unforgedPreview: CardType | null = null

    watch(showForged, async (wantForged) => {
        if (source.level === 0) {
            if (!wantForged) {
                displayCard.value = source
                return
            }
            if (!forgedPreview) {
                forgedPreview = await previewCardAtLevel(source, source.level + 1)
            }
            if (forgedPreview) displayCard.value = forgedPreview
            else showForged.value = false
            return
        }

        if (wantForged) {
            displayCard.value = source
            return
        }
        if (!unforgedPreview) {
            unforgedPreview = await previewCardAtLevel(source, 0)
        }
        if (unforgedPreview) displayCard.value = unforgedPreview
        else showForged.value = true
    })

    function close() {
        closePopUp(popUp)
    }
</script>

<style scoped lang='scss'>
.card-detail {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.forge-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;
    user-select: none;

    input {
        margin: 0;
        accent-color: #000;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
