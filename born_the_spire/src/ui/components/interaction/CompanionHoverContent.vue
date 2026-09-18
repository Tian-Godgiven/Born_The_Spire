<template>
<div class="companion-popup">
    <header class="popup-header">
        <strong>{{ companion.label }}</strong>
        <span>{{ maxHealth }} HP</span>
    </header>

    <div v-if="organs.length || cards.length" class="popup-divider"></div>

    <div v-if="organs.length" class="preview-row">
        <span class="row-label">器官</span>
        <OrganRefText
            v-for="organ in organs"
            :key="organ.key"
            :organ-key="organ.key"
            placement="right"
            align="start"
        />
    </div>

    <div v-if="cards.length" class="preview-row">
        <span class="row-label">行动</span>
        <CardRefText
            v-for="segment in cards"
            :key="String(segment.cardRef)"
            :segment="segment"
        />
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Companion } from '@/core/objects/target/Companion'
import { getCardModifier } from '@/core/objects/system/modifier/CardModifier'
import type { DescribeSegment } from '@/ui/hooks/express/describe'
import OrganRefText from '@/ui/components/display/OrganRefText.vue'
import CardRefText from '@/ui/components/display/CardRefText.vue'

const props = defineProps<{ companion: Companion }>()

const maxHealth = computed(() => Number(props.companion.status['max-health']?.value ?? 0))
const organs = computed(() => props.companion.getOrganList())
const cards = computed<DescribeSegment[]>(() => getCardModifier(props.companion).getAllCards().map(card => ({
    text: card.displayName,
    type: 'card',
    cardRef: card.key,
    cardRefType: 'key'
})))
</script>

<style scoped lang="scss">
.companion-popup {
    width: 280px;
    max-width: 100%;
    box-sizing: border-box;
    padding: 12px;
    color: inherit;
    background-color: #fff;
    border: 2px solid #000;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 16px;
}

.popup-header > span {
    flex: none;
    font-size: 12px;
}

.popup-divider {
    height: 1px;
    margin: 8px 0;
    background: black;
}

.preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    line-height: 1.5;
}

.preview-row + .preview-row {
    margin-top: 6px;
}

.row-label {
    color: #666;
    font-size: 12px;
}
</style>
