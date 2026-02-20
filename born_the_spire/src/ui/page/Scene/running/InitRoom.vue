<template>
<div class="init-room">
    <div class="init-content">
        <!-- 初始化标题 -->
        <div class="init-header">
            <h1 class="init-title">{{ initTitle }}</h1>
        </div>

        <!-- 初始化描述 -->
        <div class="init-description">
            <p>{{ initDescription }}</p>
        </div>

        <!-- 自定义组件（如果有） -->
        <div v-if="customComponent" class="init-custom">
            <component :is="customComponent" />
        </div>

        <!-- 选项列表 -->
        <div class="init-options">
            <div
                v-for="choice in choices"
                :key="choice.__key"
                class="init-option"
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
import { InitRoom } from '@/core/objects/room/InitRoom'
import type { Choice } from '@/core/objects/system/Choice'

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof InitRoom) {
        return room
    }
    return null
})

// 初始化标题
const initTitle = computed(() => {
    return currentRoom.value?.initConfig.title || ''
})

// 初始化描述
const initDescription = computed(() => {
    return currentRoom.value?.initConfig.description || ''
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

        // 初始化房间是单选模式，选择后自动完成
        await currentRoom.value?.choiceGroup.complete()
    } catch (error) {
        console.error('[InitRoom] 选择失败:', error)
    }
}
</script>

<style scoped lang='scss'>
.init-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
}

.init-content {
    width: 80%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.init-header {
    text-align: left;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
}

.init-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: bold;
}

.init-description {
    text-align: center;
    padding: 1rem 2rem;
    background: white;
}

.init-description p {
    font-size: 1.2rem;
    margin: 0;
    line-height: 1.6;
}

.init-custom {
    border: 2px solid black;
    padding: 2rem;
    background: white;
}

// 选项展示
.init-options {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.init-option {
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
