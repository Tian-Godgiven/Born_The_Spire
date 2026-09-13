<template>
<Popover
    v-if="relicKeys.length > 0 && anchor"
    inline
    :trigger-element="anchor"
    placement="left"
    align="start"
    :max-width="350"
    @update:show="handleShow"
>
    <template #content>
        <div class="mark-relics">
            <RelicHoverContent
                v-for="relic in relics"
                :key="relic.__id"
                :relic="relic"
            />
        </div>
    </template>
</Popover>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import Popover from "@/ui/components/global/Popover.vue"
import RelicHoverContent from "@/ui/components/interaction/RelicHoverContent.vue"
import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import { getCardMarkRelicKeys } from "@/core/effects/card/cardMark"
import { resolveRelicForPreview } from "@/ui/hooks/express/relicPreview"

/**
 * 卡组里悬停被遗物盯上的牌时，在左侧弹出对应遗物。不改卡面描述。
 */
const { card, anchor } = defineProps<{
    card: Card
    anchor?: HTMLElement | null
}>()

const relics = shallowRef<Relic[]>([])

const relicKeys = computed(() => getCardMarkRelicKeys(card))

watch(relicKeys, async (keys) => {
    relics.value = []
    const resolved: Relic[] = []
    for (const key of keys) {
        const relic = await resolveRelicForPreview(key)
        if (relic) resolved.push(relic)
    }
    relics.value = resolved
}, { immediate: true })

async function handleShow(shown: boolean) {
    if (!shown || relics.value.length > 0) return
    const resolved: Relic[] = []
    for (const key of relicKeys.value) {
        const relic = await resolveRelicForPreview(key)
        if (relic) resolved.push(relic)
    }
    relics.value = resolved
}
</script>

<style scoped lang="scss">
.mark-relics {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
