<template>
<Popover inline :placement="placement" :align="align" :anchor="anchor" :max-width="320" @update:show="loadPreview">
    <span class="companion-ref">{{ label }}</span>
    <template #content>
        <CompanionHoverContent v-if="companion" :companion="companion" />
    </template>
</Popover>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Popover from '@/ui/components/global/Popover.vue'
import CompanionHoverContent from '@/ui/components/interaction/CompanionHoverContent.vue'
import { companionList } from '@/static/list/target/companionList'
import type { Companion } from '@/core/objects/target/Companion'

const props = withDefaults(defineProps<{ companionKey: string, anchor?: HTMLElement | null, placement?: 'left' | 'right' | 'top' | 'bottom', align?: 'start' | 'center' | 'trigger' | number }>(), { anchor: null, placement: 'right', align: 'start' })
const companion = shallowRef<Companion | null>(null)
const label = computed(() => companionList.find(item => item.key === props.companionKey)?.label ?? '[召唤物]')
async function loadPreview(show: boolean) {
    if (!show || companion.value?.key === props.companionKey) return
    const { getCompanionByKey } = await import('@/static/list/target/companionList')
    companion.value = await getCompanionByKey(props.companionKey)
}
</script>

<style scoped lang="scss">
.companion-ref { color: #0f766e; font-weight: bold; text-decoration: underline; cursor: help; }
</style>
