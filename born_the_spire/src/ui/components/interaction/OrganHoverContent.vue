<template>
<div class="organ-hover-stack" :class="{ reverse }">
    <OrganPopup :organ="organ" :prefer-player-cards="preferPlayerCards" />
    <OrganMilestoneTrack v-if="showMilestones" :organ="organ" />
</div>
</template>

<script lang="ts">
import type { Organ } from '@/core/objects/target/Organ'
import { getOrganMilestones } from '@/static/list/target/organQuality'

export function organHoverMaxWidth(organ: Organ, showMilestones = true): number {
    if (!showMilestones) return 270
    return getOrganMilestones(organ).length > 0 ? 560 : 270
}
</script>

<script setup lang="ts">
import { Organ } from '@/core/objects/target/Organ'
import OrganPopup from '@/ui/components/interaction/OrganPopup.vue'
import OrganMilestoneTrack from '@/ui/components/interaction/OrganMilestoneTrack.vue'

withDefaults(defineProps<{
    organ: Organ
    /** 朝左展开时反过来，让介绍仍贴着触发它的方块 */
    reverse?: boolean
    /** 奖励界面：卡名预览优先玩家版 */
    preferPlayerCards?: boolean
    /** 选器官 / 洗涤 / 战利品默认开；战斗悬停默认关 */
    showMilestones?: boolean
}>(), {
    showMilestones: true
})
</script>

<style scoped lang="scss">
.organ-hover-stack {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    white-space: normal;

    &.reverse {
        flex-direction: row-reverse;
    }

    :deep(.organ-popup) {
        flex-shrink: 0;
    }
}
</style>
