<template>
<div class="victory-room">
    <div class="victory-content">
        <div class="victory-title">通关！</div>

        <RunStatsPanel :stats="stats" />

        <div class="actions">
            <button class="action-btn" @click="handleRestart">
                再来一发
            </button>
            <button class="action-btn primary" @click="handleBackToMainMenu">
                返回主菜单
            </button>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { restartRun, backToMainMenu } from '@/core/hooks/game'
import { getRunStats } from '@/core/objects/room/RunStats'
import type { RunStats } from '@/core/objects/room/RunStats'
import RunStatsPanel from '@/ui/components/object/Room/RunStatsPanel.vue'

const stats = ref<RunStats>({
    floor: 0,
    roomsVisited: 0
})

onMounted(async () => {
    stats.value = await getRunStats()
})

async function handleRestart() {
    await restartRun()
}

async function handleBackToMainMenu() {
    await backToMainMenu()
}
</script>

<style scoped lang="scss">
.victory-room {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.victory-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 60px 80px;
    background: white;
    border: 2px solid black;
}

.victory-title {
    font-size: 48px;
    font-weight: bold;
}

.actions {
    display: flex;
    gap: 16px;
    margin-top: 16px;
}

.action-btn {
    padding: 12px 32px;
    background: white;
    border: 2px solid black;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }

    &.primary {
        background: black;
        color: white;

        &:hover {
            background: #222;
        }

        &:active {
            background: #111;
        }
    }
}
</style>
