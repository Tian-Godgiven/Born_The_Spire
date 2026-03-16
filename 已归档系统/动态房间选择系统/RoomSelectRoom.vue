<template>
<div class="roomselect-room">
    <div class="roomselect-content">
        <!-- 房间选择标题 -->
        <div class="roomselect-header">
            <h1 class="roomselect-title">{{ selectTitle }}</h1>
        </div>

        <!-- 房间选择描述 -->
        <div class="roomselect-description">
            <p>选择一个房间进入</p>
        </div>

        <!-- 房间选项 -->
        <div class="room-options">
            <div
                v-for="room in availableRooms"
                :key="room.__key"
                class="room-option"
                @click="handleSelectRoom(room)"
            >
                <div class="room-icon">{{ room.getIcon() }}</div>
                <div class="room-info">
                    <div class="room-name">{{ room.getDisplayName() }}</div>
                    <div v-if="room.description" class="room-description">{{ room.description }}</div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { RoomSelectRoom } from '@/core/objects/room/RoomSelectRoom'
import { Room } from '@/core/objects/room/Room'

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof RoomSelectRoom) {
        return room
    }
    return null
})

// 选择标题
const selectTitle = computed(() => {
    const layer = currentRoom.value?.targetLayer
    return layer ? `选择第 ${layer} 层的房间` : '选择房间'
})

// 可选房间列表
const availableRooms = computed(() => {
    return currentRoom.value?.getAvailableRooms() || []
})

// 选择房间
async function handleSelectRoom(room: Room) {
    if (!currentRoom.value) return

    // 通过 ChoiceGroup 选择房间
    const choiceGroup = currentRoom.value.getChoiceGroup()
    const choice = choiceGroup.choices.find(c => c.customData?.room === room)

    if (choice) {
        await choiceGroup.selectChoice(choice)
    }
}
</script>

<style scoped lang='scss'>
.roomselect-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
}

.roomselect-content {
    width: 80%;
    max-width: 900px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.roomselect-header {
    text-align: center;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
}

.roomselect-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: bold;
}

.roomselect-description {
    text-align: center;
    padding: 1rem 2rem;
    border: 2px solid black;
    background: white;
}

.roomselect-description p {
    font-size: 1.2rem;
    margin: 0;
    line-height: 1.6;
}

.room-options {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.room-option {
    border: 2px solid black;
    padding: 2rem;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 2rem;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.room-icon {
    font-size: 4rem;
    min-width: 5rem;
    text-align: center;
}

.room-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.room-name {
    font-size: 2rem;
    font-weight: bold;
}

.room-description {
    font-size: 1.2rem;
    color: #666;
}
</style>
