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
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { PoolRoom } from '@/core/objects/room/PoolRoom'
import ChoiceContainer from '@/ui/components/system/ChoiceContainer.vue'

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

.pool-choices {
    // ChoiceContainer 自带样式
}
</style>
