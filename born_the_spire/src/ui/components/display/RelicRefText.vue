<template>
<Popover
    inline
    :placement="placement"
    :align="align"
    :anchor="anchor"
    :max-width="350"
    @update:show="handleShow"
>
    <span class="relic-ref">【{{ displayLabel }}】</span>
    <template #content>
        <RelicHoverContent v-if="relic" :relic="relic" />
    </template>
</Popover>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from "vue"
import Popover from "@/ui/components/global/Popover.vue"
import RelicHoverContent from "@/ui/components/interaction/RelicHoverContent.vue"
import { getLazyModule } from "@/core/utils/lazyLoader"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import { resolveRelicForPreview } from "@/ui/hooks/express/relicPreview"

/**
 * 描述文本里的遗物名引用。悬停展开 RelicHoverContent，不要另写浮层。
 * 已持有用身上那件（口香糖反标才能看到选中的牌）；未持有才按 key 造预览。
 */
const props = withDefaults(defineProps<{
    relicKey: string
    anchor?: HTMLElement | null
    placement?: "left" | "right" | "top" | "bottom"
    align?: "start" | "center" | "trigger" | number
}>(), {
    anchor: null,
    placement: "right"
})

const relic = shallowRef<Relic | null>(null)

const displayLabel = computed(() => {
    if (relic.value) return relic.value.label
    try {
        const list = getLazyModule<{ key: string, label?: string }[]>("relicList")
        return list.find(item => item.key === props.relicKey)?.label ?? "…"
    } catch {
        return "…"
    }
})

watch(() => props.relicKey, () => {
    relic.value = null
})

async function resolveRelic() {
    if (relic.value?.key === props.relicKey) return relic.value
    relic.value = await resolveRelicForPreview(props.relicKey)
    return relic.value
}

async function handleShow(shown: boolean) {
    if (!shown) return
    await resolveRelic()
}
</script>

<style scoped lang="scss">
.relic-ref {
    text-decoration: underline;
    cursor: help;
}
</style>
