<template>
<div class="glossary-panel" v-if="items.length > 0">
    <div
        v-for="item in items"
        :key="item.id"
        class="glossary-item"
    >
        <div class="glossary-term">{{ item.label }}</div>
        <div class="glossary-desc">{{ getDescribe(item.describe) }}</div>
    </div>
</div>
</template>

<script setup lang="ts">
import { getDescribe } from '@/ui/hooks/express/describe'
import type { GlossaryPanelItem } from '@/ui/hooks/express/glossary'

defineProps<{
    items: GlossaryPanelItem[]
}>()
</script>

<style scoped lang="scss">
.glossary-panel {
    background: white;
    border: 2px solid black;
    padding: var(--glossary-panel-padding, 8px);
    min-width: var(--glossary-panel-min-width, 150px);
    max-width: var(--glossary-panel-max-width, 250px);
    box-sizing: border-box;

    .glossary-item {
        margin-bottom: var(--glossary-panel-item-gap, 8px);

        &:last-child {
            margin-bottom: 0;
        }

        .glossary-term {
            font-weight: bold;
            font-size: var(--glossary-panel-term-size, 13px);
            margin-bottom: 2px;
        }

        .glossary-desc {
            font-size: var(--glossary-panel-desc-size, 12px);
            line-height: var(--glossary-panel-desc-line-height, 1.4);
            color: #333;
        }
    }
}
</style>
