<template>
<div class="defeat-room">
    <div class="defeat-content">
        <div class="defeat-title">游戏结束</div>

        <div v-if="defeatRoom?.defeatedBy" class="defeated-by">
            {{ defeatRoom.defeatedBy }}
        </div>

        <RunStatsPanel :stats="stats" />

        <div class="actions">
            <button class="action-btn" @click="handleRetry">
                重试当前房间
            </button>
            <button class="action-btn" @click="handleRestart">
                重新开始
            </button>
            <button class="action-btn primary" @click="handleBackToMainMenu">
                返回主菜单
            </button>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { retryCurrentRoom, restartRun, backToMainMenu } from '@/core/hooks/game'
import { DefeatRoom } from '@/core/objects/room/DefeatRoom'
import { getRunStats } from '@/core/objects/room/RunStats'
import type { RunStats } from '@/core/objects/room/RunStats'
import RunStatsPanel from '@/ui/components/object/Room/RunStatsPanel.vue'

const defeatRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof DefeatRoom) return room
    return null
})

const stats = ref<RunStats>({
    floor: 0,
    roomsVisited: 0
})

onMounted(async () => {
    stats.value = await getRunStats()
})

async function handleRetry() {
    await retryCurrentRoom()
}

async function handleRestart() {
    await restartRun()
}

async function handleBackToMainMenu() {
    await backToMainMenu()
}
</script>

<style scoped lang="scss">
.defeat-room {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.defeat-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 60px 80px;
    background: white;
    border: 2px solid black;
}

.defeat-title {
    font-size: 48px;
    font-weight: bold;
}

.defeated-by {
    font-size: 20px;
    color: #666;
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
