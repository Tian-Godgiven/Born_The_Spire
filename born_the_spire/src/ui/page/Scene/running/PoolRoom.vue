<template>
<div class="pool-room">
    <div class="pool-content">
        <!-- 水池标题 -->
        <div class="pool-header">
            <h1 class="pool-title">{{ poolTitle }}</h1>
        </div>

        <!-- 水池描述 -->
        <div class="pool-description">
            <p>一个宁静的休息处...</p>
        </div>

        <!-- 选项列表 -->
        <div class="pool-choices">
            <ChoiceContainer
                v-if="choiceGroup"
                :choice-group="choiceGroup"
                @completed="onPoolCompleted"
            />
        </div>
    </div>

    <!-- 离开按钮 - 悬浮在右侧 -->
    <button class="leave-button" @click="leavePool">
        离开
    </button>
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { PoolRoom } from '@/core/objects/room/PoolRoom'
import ChoiceContainer from '@/ui/components/system/ChoiceContainer.vue'
import { goToNextStep } from '@/core/hooks/step'

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof PoolRoom) {
        return room
    }
    return null
})

// 水池标题
const poolTitle = computed(() => {
    return currentRoom.value?.getDisplayName() || '水池'
})

// 选项组
const choiceGroup = computed(() => {
    return currentRoom.value?.getChoiceGroup()
})

// 水池完成回调
async function onPoolCompleted() {
    // 水池完成后的处理由 PoolRoom 内部处理
    // UI 只需要响应完成事件
}

// 离开水池
async function leavePool() {
    const room = currentRoom.value
    if (room) {
        // 完成当前房间
        await nowGameRun.completeCurrentRoom()
        // 前往下一层
        await goToNextStep()
    }
}
</script>

<style scoped lang='scss'>
.pool-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
}

.pool-content {
    width: 80%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.pool-header {
    text-align: center;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
}

.pool-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: bold;
}

.pool-description {
    text-align: center;
    padding: 1rem 2rem;
    border: 2px solid black;
    background: white;
}

.pool-description p {
    font-size: 1.2rem;
    margin: 0;
    line-height: 1.6;
}

.leave-button {
    position: fixed;
    right: 15%;
    top: 75%;
    transform: translateY(-50%);
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    background: white;
    border: 2px solid black;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}
</style>
