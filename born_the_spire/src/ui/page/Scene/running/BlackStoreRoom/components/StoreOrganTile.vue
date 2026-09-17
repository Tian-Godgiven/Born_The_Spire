<template>
<div
    class="store-organ-tile"
    :class="{
        selected,
        sold,
        'can-afford': canAfford && !sold,
        'price-right': priceRight
    }"
    @click="onSelect"
>
    <div class="organ-container">
        <div class="item-headline">
            <div class="item-name">{{ organ?.label ?? name }}</div>
            <div
                v-if="rarity"
                class="item-rarity"
                :style="{ color: selected && !sold ? undefined : rarityColor }"
            >{{ rarityText }}</div>
        </div>
        <div class="tile-divider"></div>
        <div class="tile-effect">
            <DescribeText
                v-if="organ"
                :describe="organ.describe"
                :target="organ"
                :prefer-player-cards="preferPlayerCards"
                :extra-glossaries="organ.entry"
            />
        </div>
        
    </div>

    <div class="price-container">
        <div class="item-price">{{ price }} 金币</div>
    </div>

    <div v-if="sold" class="sold-overlay">{{ soldLabel }}</div>
</div>
</template>

<script setup lang="ts">
import DescribeText from '@/ui/components/display/DescribeText.vue'
import type { Organ } from '@/core/objects/target/Organ'
import { getRarityColor, getRarityLabel } from '@/static/list/system/rarityPalette'

const {
    organ,
    name = '',
    price,
    rarity,
    selected = false,
    sold = false,
    canAfford = false,
    soldLabel = '已售出',
    preferPlayerCards = true,
    priceRight = false
} = defineProps<{
    organ: Organ | null
    name?: string
    price: number
    rarity?: string
    selected?: boolean
    sold?: boolean
    canAfford?: boolean
    soldLabel?: string
    preferPlayerCards?: boolean
    /** 收购名单：金币在 price-container 里靠右 */
    priceRight?: boolean
}>()

const emit = defineEmits<{
    select: [event: MouseEvent]
}>()

const rarityText = rarity ? getRarityLabel(rarity) : ''
const rarityColor = rarity ? getRarityColor(rarity) : undefined

function onSelect(event: MouseEvent) {
    if (sold) return
    emit('select', event)
}
</script>

<style scoped lang="scss">
.store-organ-tile {
    flex: none;
    width: calc((100% - 4 * var(--layout-store-item-gap)) / 5);
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: white;

    &:hover:not(.sold) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.selected:not(.sold) .organ-container {
        background: black;
        color: white;
    }

    &.can-afford:not(.sold) .organ-container {
        border-color: green;
    }

    &.sold {
        opacity: 0.4;
        cursor: not-allowed;
    }

    &.price-right .price-container {
        display: flex;
        width: 100%;
        justify-content: flex-end;
    }
}

.organ-container{
    height: 100%;
        padding: 0.8rem;
        border: 2px solid black;
}

.item-headline {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
}

.item-name {
    font-weight: bold;
    font-size: 1rem;
    min-width: 0;
}

.item-rarity {
    flex-shrink: 0;
    font-size: 0.75rem;
}

.tile-divider {
    height: 1px;
    margin: 2px 0px;
    background-color: currentColor;
    opacity: 0.35;
}

.tile-effect {
    font-size: 0.8rem;
    line-height: 1.4;
    flex: 1;
}

.price-container{
    display: inline-flex;
    justify-content: space-between;
    height: 45px;
    .item-price {
        font-size: 0.9rem;
        margin-top: 0.2rem;
    }
}


.sold-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: bold;
    color: red;
}
</style>
