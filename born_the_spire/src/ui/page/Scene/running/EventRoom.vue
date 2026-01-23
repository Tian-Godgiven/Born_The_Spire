<template>
<div class="event-room">
    <div class="event-content">
        <!-- 事件标题 -->
        <div class="event-header">
            <h1 class="event-title">{{ eventTitle }}</h1>
        </div>

        <!-- 事件描述 -->
        <div class="event-description">
            <p>{{ eventDescription }}</p>
        </div>

        <!-- 自定义事件组件（如果有） -->
        <div v-if="customComponent" class="event-custom">
            <component :is="customComponent" />
        </div>

        <!-- 事件选项列表（独特的展示方式） -->
        <div class="event-options">
            <div
                v-for="choice in choices"
                :key="choice.__key"
                class="event-option"
                :class="{
                    'option-available': choice.isAvailable(),
                    'option-disabled': !choice.isAvailable()
                }"
                @click="handleOptionClick(choice)"
            >
                <!-- 自定义组件渲染 -->
                <component
                    v-if="choice.component"
                    :is="choice.component"
                    :choice="choice"
                />

                <!-- 默认渲染 -->
                <div v-else class="option-content">
                    <div class="option-title">{{ choice.title }}</div>
                    <div v-if="choice.description" class="option-description">
                        {{ choice.description }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { EventRoom } from '@/core/objects/room/EventRoom'
import type { Choice } from '@/core/objects/system/Choice'

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof EventRoom) {
        return room
    }
    return null
})

// 事件标题
const eventTitle = computed(() => {
    return currentRoom.value?.eventConfig.title || ''
})

// 事件描述
const eventDescription = computed(() => {
    return currentRoom.value?.eventConfig.description || ''
})

// 选项列表
const choices = computed(() => {
    return currentRoom.value?.choiceGroup.choices || []
})

// 自定义组件
const customComponent = computed(() => {
    return currentRoom.value?.getCustomComponent()
})

// 处理选项点击
async function handleOptionClick(choice: Choice) {
    if (!choice.isAvailable()) {
        return
    }

    try {
        // 选择选项（会触发 onSelect 回调）
        await currentRoom.value?.choiceGroup.selectChoice(choice)

        // 事件房间是单选模式，选择后自动完成
        await currentRoom.value?.choiceGroup.complete()
    } catch (error) {
        console.error('[EventRoom] 选择失败:', error)
    }
}
</script>

<style scoped lang='scss'>
.event-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
}

.event-content {
    width: 80%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.event-header {
    text-align: left;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
}

.event-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: bold;
}

.event-description {
    text-align: center;
    padding: 1rem 2rem;
    background: white;
}

.event-description p {
    font-size: 1.2rem;
    margin: 0;
    line-height: 1.6;
}

.event-custom {
    border: 2px solid black;
    padding: 2rem;
    background: white;
}

// 事件选项的独特展示
.event-options {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.event-option {
    border: 2px solid black;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &.option-available:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.option-disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.option-content {
    padding: 1.5rem 2rem;
}

.option-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.option-description {
    font-size: 1rem;
    color: #666;
    line-height: 1.5;
}
</style>
