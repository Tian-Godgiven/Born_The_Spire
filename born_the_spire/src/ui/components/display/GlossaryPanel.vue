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
    padding: 8px;
    min-width: 150px;
    max-width: 250px;
    box-sizing: border-box;

    .glossary-item {
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }

        .glossary-term {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 2px;
        }

        .glossary-desc {
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
    }
}
</style>
