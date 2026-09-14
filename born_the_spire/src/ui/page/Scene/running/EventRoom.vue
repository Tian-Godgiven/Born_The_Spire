<template>
<div class="event-room">
    <!-- 战斗阶段：渲染 BattleView -->
    <template v-if="currentPhase === 'battle'">
        <BattleView @battle-end="onBattleEnd" />
    </template>

    <!-- 幕级整页组件：自己画标题/正文/选项 -->
    <component
        v-else-if="sceneComponent && sceneContext"
        :is="sceneComponent"
        :key="currentSceneKey || 'scene'"
        v-bind="sceneContext"
    />

    <!-- 事件阶段：渲染事件UI -->
    <template v-else>
    <div class="event-content" ref="animRef">
            <!-- 事件标题 -->
            <div class="event-header">
                <h1 class="event-title">{{ eventTitle }}</h1>
            </div>

            <!-- 事件描述：Describe 正文 -->
            <div class="event-description">
                <p>
                    <DescribeText :key="currentSceneKey || 'scene'" :describe="sceneDescribe" />
                </p>
            </div>

            <!-- 自定义事件组件（如果有） -->
            <div v-if="customComponent && sceneContext" class="event-custom">
                <component :is="customComponent" v-bind="sceneContext" />
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
                        v-if="choice.component && sceneContext"
                        :is="choice.component"
                        v-bind="sceneContext"
                        :choice="choice"
                    />

                    <!-- 默认渲染 -->
                    <div v-else class="option-content">
                        <div class="option-title">{{ choice.title }}</div>
                        <div v-if="hasOptionDescription(choice)" class="option-description">
                            <DescribeText
                                :describe="choice.getDescribeData()"
                                bracket-cards
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>
</div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { nowGameRun } from '@/core/objects/game/run'
import { EventRoom } from '@/core/objects/room/EventRoom'
import type { Choice } from '@/core/objects/system/Choice'
import BattleView from './BattleView.vue'
import DescribeText from '@/ui/components/display/DescribeText.vue'
import { useAnimation } from '@/ui/animation/useAnimation'
import { normalizeDescribe } from '@/ui/hooks/express/describe'

const { animRef, play } = useAnimation('event_room_content')


// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof EventRoom) {
        return room
    }
    return null
})

// 当前阶段
const currentPhase = computed(() => {
    return currentRoom.value?.currentPhase || 'event'
})

// 事件标题（随幕切换更新）
const eventTitle = computed(() => {
    return currentRoom.value?.currentTitle || ''
})

const sceneDescribe = computed(() => {
    const room = currentRoom.value
    if (!room) return []
    const scene = room.getCurrentScene()
    const raw = scene
        ? (typeof scene.description === "function" ? scene.description(room.getSceneData()) : scene.description)
        : room.eventConfig.description
    return normalizeDescribe(raw)
})

// 选项列表
const choices = computed(() => {
    return currentRoom.value?.choiceGroup.choices || []
})

// 幕级整页组件
const sceneComponent = computed(() => {
    return currentRoom.value?.getSceneComponent()
})

const currentSceneKey = computed(() => {
    return currentRoom.value?.currentSceneKey || null
})

const sceneContext = computed(() => {
    const room = currentRoom.value
    if (!room) return null
    return {
        room,
        event: room.eventConfig,
        scene: room.getCurrentScene(),
        sceneData: room.getSceneData(),
        choices: room.choiceGroup.choices,
    }
})

// 事件顶层插页组件
const customComponent = computed(() => {
    return currentRoom.value?.getCustomComponent()
})

function hasOptionDescription(choice: Choice): boolean {
    return choice.getDescribeData().length > 0
}

// 处理选项点击
async function handleOptionClick(choice: Choice) {
    if (!choice.isAvailable()) {
        return
    }

    const fade = !!choice.customData?.option?.fadeToNext
    try {
        if (fade) await (await play('event_fade_out')).promise
        await currentRoom.value?.selectChoice(choice)
        if (fade) await (await play('event_fade_in')).promise
    } catch (error) {
        if (fade) await (await play('event_fade_in')).promise
        console.error('[EventRoom] 选择失败:', error)
    }
}

// 处理战斗结束
async function onBattleEnd(result: 'player_win' | 'player_lose') {
    await currentRoom.value?.handleBattleEnd(result)
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
    gap: var(--layout-event-gap);
}

.event-header {
    text-align: left;
    border-bottom: 2px solid black;
    padding-bottom: var(--layout-gap-sm);
}

.event-title {
    font-size: var(--layout-event-title-size);
    margin: 0;
    font-weight: bold;
}

.event-description {
    text-align: left;
    padding: var(--layout-event-option-pad);
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
    gap: var(--layout-event-option-gap);
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
    padding: var(--layout-event-option-pad);
}

.option-title {
    font-size: var(--layout-event-option-title-size);
    font-weight: bold;
    margin-bottom: var(--layout-gap-sm);
}

.option-description {
    font-size: 1rem;
    color: #666;
    line-height: 1.5;
}
</style>
