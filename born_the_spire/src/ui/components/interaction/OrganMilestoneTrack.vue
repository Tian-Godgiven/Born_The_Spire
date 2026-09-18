<template>
<div v-if="rows.length > 0" class="milestone-track">
    <div
        v-for="row in rows"
        :key="row.level"
        class="milestone-row"
        :class="row.state"
    >
        <div class="milestone-lv">
            Lv.{{ row.level }}<span v-if="row.state === 'next'"> 下一档</span>
        </div>
        <DescribeText :describe="row.describe" :target="organ" />
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Organ } from '@/core/objects/target/Organ'
import { getOrganMilestones } from '@/static/list/target/organQuality'
import DescribeText from '@/ui/components/display/DescribeText.vue'
import { resolveOrganMilestoneDescribe } from '@/ui/hooks/express/describe'

const { organ } = defineProps<{
    organ: Organ
}>()

type MilestoneRowState = 'reached' | 'next' | 'later'

const rows = computed(() => {
    const milestones = getOrganMilestones(organ)
    const next = milestones.find(m => m.level > organ.level)
    const source = organ.upgradeConfig?.milestones ?? []
    return milestones.map(m => {
        const sourceItem = source.find(item => item.level === m.level)
        let state: MilestoneRowState = 'later'
        if (m.level <= organ.level) state = 'reached'
        else if (next && m.level === next.level) state = 'next'
        return {
            level: m.level,
            describe: resolveOrganMilestoneDescribe(organ, sourceItem ?? m),
            state
        }
    })
})
</script>

<style scoped lang="scss">
.milestone-track {
    width: var(--milestone-track-width, 240px);
    box-sizing: border-box;
    flex-shrink: 0;
    font-size: var(--milestone-track-font-size, 14px);
    white-space: normal;
    background: white;

    .track-title {
        font-weight: bold;
        margin-bottom: 8px;
    }

    .milestone-row {
        border: 2px solid black;
        padding: var(--milestone-row-padding, 8px);
        margin-bottom: var(--milestone-row-gap, 8px);

        &:last-child {
            margin-bottom: 0;
        }

        .milestone-lv {
            font-weight: bold;
            margin-bottom: var(--milestone-level-gap, 4px);
        }

        &.reached {
            background: black;
            color: white;

            :deep(.describe-text) {
                color: white;
            }
        }

        &.next,
        &.later {
            background: white;
            color: black;
        }
    }
}
</style>
