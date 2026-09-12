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
    <div class="event-content">
            <!-- 事件标题 -->
            <div class="event-header">
                <h1 class="event-title">{{ eventTitle }}</h1>
            </div>

            <!-- 事件描述：正文里 /br/ 换行 -->
            <div class="event-description">
                <p>
                    <template v-for="(line, i) in descriptionLines" :key="i">
                        <br v-if="i > 0">{{ line }}
                    </template>
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
                            <template v-if="optionPreviewOrganKey(choice)">
                                {{ choice.getDescription() }}<OrganRefText
                                    :organ-key="optionPreviewOrganKey(choice) ?? ''"
                                    :evolution-rounds="optionEvolutionRounds()"
                                />{{ optionPreviewOrganAfter(choice) }}
                            </template>
                            <template v-else>
                                <template v-for="(line, i) in optionDescriptionLines(choice)" :key="i">
                                    <br v-if="i > 0">{{ line }}
                                </template>
                            </template>
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
import OrganRefText from '@/ui/components/display/OrganRefText.vue'


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

// 事件描述（随幕切换更新）。正文里用 /br/ 换行
const eventDescription = computed(() => {
    return currentRoom.value?.currentDescription || ''
})

const descriptionLines = computed(() =>
    eventDescription.value.split(/\s*\/br\/\s*/).filter(line => line.length > 0)
)

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

function optionPreviewOrganKey(choice: Choice): string | undefined {
    const option = choice.customData?.option
    if (!option?.previewOrganKey) return undefined
    const data = currentRoom.value?.getSceneData()
    const key = typeof option.previewOrganKey === "function"
        ? option.previewOrganKey(data)
        : option.previewOrganKey
    return key || undefined
}

function optionPreviewOrganAfter(choice: Choice): string {
    const option = choice.customData?.option
    if (!option?.previewOrganAfter) return ""
    const data = currentRoom.value?.getSceneData()
    return typeof option.previewOrganAfter === "function"
        ? (option.previewOrganAfter(data) ?? "")
        : option.previewOrganAfter
}

function optionEvolutionRounds(): number {
    return Number(currentRoom.value?.getSceneData()?.evolutionRounds ?? 0)
}

function optionDescriptionLines(choice: Choice): string[] {
    return choice.getDescription().split(/\s*\/br\/\s*/).filter(line => line.length > 0)
}

function hasOptionDescription(choice: Choice): boolean {
    return optionDescriptionLines(choice).length > 0 || !!optionPreviewOrganKey(choice)
}

// 处理选项点击
async function handleOptionClick(choice: Choice) {
    if (!choice.isAvailable()) {
        return
    }

    try {
        // 选择选项（会触发 onSelect 回调）
        await currentRoom.value?.selectChoice(choice)
    } catch (error) {
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
    text-align: left;
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
