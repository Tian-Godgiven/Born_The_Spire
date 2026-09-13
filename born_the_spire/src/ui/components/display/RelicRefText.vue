<template>
<Popover
    inline
    placement="right"
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
import { computed, shallowRef, markRaw, watch } from "vue"
import Popover from "@/ui/components/global/Popover.vue"
import RelicHoverContent from "@/ui/components/interaction/RelicHoverContent.vue"
import { getLazyModule } from "@/core/utils/lazyLoader"
import type { Relic } from "@/core/objects/item/Subclass/Relic"

/**
 * 描述文本里的遗物名引用。悬停展开 RelicHoverContent，不要另写浮层。
 * 标签先从表里读；完整实例在首次悬停时才 create。
 */
const props = defineProps<{
    relicKey: string
}>()

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
    try {
        const list = getLazyModule<any[]>("relicList")
        const map = list.find(item => item.key === props.relicKey)
        if (!map) return null
        const { createRelic } = await import("@/core/factories")
        relic.value = markRaw(await createRelic(map) as Relic)
        return relic.value
    } catch (error) {
        console.error("[RelicRefText] 无法加载遗物", props.relicKey, error)
        return null
    }
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
