<template>
<Popover
    inline
    placement="right"
    :max-width="hoverMaxWidth"
    @update:show="handleShow"
>
    <span class="organ-ref">【{{ displayLabel }}】</span>
    <template #content>
        <OrganHoverContent v-if="organ" :organ="organ" prefer-player-cards />
    </template>
</Popover>
</template>

<script setup lang='ts'>
    import { computed, shallowRef, markRaw, watch } from 'vue'
    import Popover from '@/ui/components/global/Popover.vue'
    import OrganHoverContent, { organHoverMaxWidth } from '@/ui/components/interaction/OrganHoverContent.vue'
    import { getLazyModule } from '@/core/utils/lazyLoader'
    import type { Organ } from '@/core/objects/target/Organ'

    /**
     * 事件选项等处的器官名引用。悬停展开 OrganHoverContent，不要另写浮层。
     * 标签先从器官表读；完整实例在首次悬停时才 create。
     */
    const props = withDefaults(defineProps<{
        organKey: string
        evolutionRounds?: number
    }>(), {
        evolutionRounds: 0
    })

    const organ = shallowRef<Organ | null>(null)

    const displayLabel = computed(() => {
        if (organ.value) return organ.value.label
        try {
            const list = getLazyModule<{ key: string, label?: string }[]>('organList')
            return list.find(item => item.key === props.organKey)?.label ?? "…"
        } catch {
            return "…"
        }
    })

    const hoverMaxWidth = computed(() => organ.value ? organHoverMaxWidth(organ.value) : 270)

    watch(() => [props.organKey, props.evolutionRounds], () => {
        organ.value = null
    })

    async function resolveOrgan() {
        if (organ.value?.key === props.organKey) return organ.value
        try {
            const { getOrganByKey } = await import('@/static/list/target/organList')
            const created = await getOrganByKey(props.organKey)
            if (props.evolutionRounds > 0) {
                created.status["evolutionRounds"]?.setOriginalBaseValue(props.evolutionRounds)
            }
            organ.value = markRaw(created)
            return organ.value
        } catch (error) {
            console.error("[OrganRefText] 无法加载器官", props.organKey, error)
            return null
        }
    }

    async function handleShow(shown: boolean) {
        if (!shown) return
        await resolveOrgan()
    }
</script>

<style scoped lang='scss'>
.organ-ref {
    text-decoration: underline;
    cursor: help;
}
</style>
