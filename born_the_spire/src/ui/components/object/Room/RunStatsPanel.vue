<template>
<div class="stats">
    <div class="stat-item">
        <span class="stat-label">到达层数</span>
        <span class="stat-value">{{ stats.floor }}</span>
    </div>
    <div class="stat-item">
        <span class="stat-label">经过房间</span>
        <span class="stat-value">{{ stats.roomsVisited }}</span>
    </div>
</div>
</template>

<script setup lang="ts">
import type { RunStats } from '@/core/objects/room/RunStats'

defineProps<{
    stats: RunStats
}>()
</script>

<style scoped lang="scss">
.stats {
    display: flex;
    gap: 48px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.stat-label {
    font-size: 14px;
    color: #999;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
}
</style>
