<template>
<div class="room-tester" v-if="isVisible">
    <div class="header">
        <span>房间测试工具</span>
        <button @click="close">×</button>
    </div>
    <div class="content">
        <div class="filter">
            <label>房间类型：</label>
            <select v-model="selectedType">
                <option value="">全部</option>
                <option value="battle">战斗</option>
                <option value="event">事件</option>
                <option value="pool">水池</option>
                <option value="blackStore">黑市</option>
                <option value="roomSelect">房间选择</option>
            </select>
        </div>
        <div class="room-list">
            <div
                v-for="room in filteredRooms"
                :key="room.key"
                class="room-item"
                @click="enterRoom(room.key)"
            >
                <div class="room-name">{{ room.name || room.key }}</div>
                <div class="room-info">
                    <span class="room-type">{{ room.type }}</span>
                    <span class="room-key">{{ room.key }}</span>
                </div>
            </div>
        </div>
        <div class="layer-control">
            <label>层级：</label>
            <input type="number" v-model.number="layer" min="0" max="50" />
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { roomRegistry } from '@/static/registry/roomRegistry'
import router from '@/ui/router'

const isVisible = ref(false)
const selectedType = ref('')
const layer = ref(1)
const allRooms = ref<any[]>([])

// 筛选后的房间列表
const filteredRooms = computed(() => {
    if (!selectedType.value) {
        return allRooms.value
    }
    return allRooms.value.filter(r => r.type === selectedType.value)
})

// 加载所有房间
onMounted(() => {
    allRooms.value = roomRegistry.getAllRoomConfigs()
})

// 进入指定房间
async function enterRoom(roomKey: string) {
    console.log(`[RoomTester] 进入房间: ${roomKey}, 层级: ${layer.value}`)

    const room = roomRegistry.createRoom(roomKey, layer.value)

    if (!room) {
        console.error(`[RoomTester] 创建房间失败: ${roomKey}`)
        alert(`创建房间失败: ${roomKey}`)
        return
    }

    if (!nowGameRun.value) {
        console.error(`[RoomTester] 游戏未开始，请先点击"开始游戏"`)
        alert('请先点击"开始游戏"')
        return
    }

    await nowGameRun.value.enterRoom(room)
    console.log(`[RoomTester] 成功进入房间: ${roomKey}`)

    // 如果不在 running 页面，跳转过去
    if (router.currentRoute.value.path !== '/running') {
        router.replace('/running')
    }

    // 进入房间后关闭面板
    close()
}

function close() {
    isVisible.value = false
}

// 暴露打开方法
function open() {
    isVisible.value = true
    // 刷新房间列表
    allRooms.value = roomRegistry.getAllRoomConfigs()
}

// 暴露到全局供外部调用
;(window as any).openRoomTester = open

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.room-tester {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-height: 600px;
    background: white;
    border: 2px solid black;
    z-index: 1000;
    display: flex;
    flex-direction: column;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 2px solid black;
        font-weight: bold;

        button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            line-height: 1;

            &:hover {
                background: rgba(0, 0, 0, 0.05);
            }
        }
    }

    .content {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
    }

    .filter {
        display: flex;
        align-items: center;
        gap: 10px;

        select {
            flex: 1;
            padding: 5px;
            border: 2px solid black;
            background: white;
            cursor: pointer;
        }
    }

    .room-list {
        flex: 1;
        overflow-y: auto;
        border: 2px solid black;
        max-height: 400px;
    }

    .room-item {
        padding: 10px;
        border-bottom: 1px solid #ccc;
        cursor: pointer;

        &:hover {
            background: rgba(0, 0, 0, 0.05);
        }

        &:last-child {
            border-bottom: none;
        }

        .room-name {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .room-info {
            display: flex;
            gap: 10px;
            font-size: 12px;
            color: #666;

            .room-type {
                padding: 2px 6px;
                background: #f0f0f0;
                border: 1px solid #ccc;
            }

            .room-key {
                font-family: monospace;
            }
        }
    }

    .layer-control {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-top: 10px;
        border-top: 2px solid black;

        input {
            flex: 1;
            padding: 5px;
            border: 2px solid black;
        }
    }
}
</style>
