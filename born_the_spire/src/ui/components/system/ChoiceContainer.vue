<template>
    <div class="choice-container">
        <!-- 标题和描述 -->
        <div v-if="choiceGroup.title || choiceGroup.description" class="choice-header">
            <h2 v-if="choiceGroup.title" class="choice-title">{{ choiceGroup.title }}</h2>
            <p v-if="choiceGroup.description" class="choice-description">{{ choiceGroup.description }}</p>
        </div>

        <!-- 选项列表 -->
        <div class="choice-list">
            <div
                v-for="choice in choiceGroup.choices"
                :key="choice.__key"
                class="choice-item"
                :class="{
                    'choice-available': choice.isAvailable(),
                    'choice-selected': choice.isSelected(),
                    'choice-locked': choice.isLocked(),
                    'choice-disabled': choice.isDisabled()
                }"
                @click="handleChoiceClick(choice)"
            >
                <!-- 自定义组件渲染 -->
                <component
                    v-if="choice.component"
                    :is="choice.component"
                    :choice="choice"
                />

                <!-- 默认渲染 -->
                <div v-else class="choice-default">
                    <div v-if="choice.icon" class="choice-icon">{{ choice.icon }}</div>
                    <div class="choice-info">
                        <div class="choice-name">{{ choice.title }}</div>
                        <div v-if="choice.description" class="choice-desc">{{ choice.description }}</div>
                    </div>
                    <div v-if="choice.isSelected()" class="choice-selected-badge">✓</div>
                </div>
            </div>
        </div>

        <!-- 确认按钮（多选模式） -->
        <div v-if="showConfirmButton" class="choice-actions">
            <button
                class="confirm-button"
                :disabled="!choiceGroup.canComplete()"
                @click="handleConfirm"
            >
                {{ confirmButtonText }}
            </button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { Choice, ChoiceGroup } from '@/core/objects/system/Choice'

const props = defineProps<{
    choiceGroup: ChoiceGroup
    confirmButtonText?: string
}>()

const emit = defineEmits<{
    choiceSelected: [choice: Choice]
    completed: [selected: Choice[]]
}>()

/**
 * 是否显示确认按钮
 * 多选模式下显示
 */
const showConfirmButton = computed(() => {
    return props.choiceGroup.maxSelect > 1
})

/**
 * 处理选项点击
 */
async function handleChoiceClick(choice: Choice) {
    if (!choice.isAvailable()) {
        return
    }

    try {
        await props.choiceGroup.selectChoice(choice)
        emit('choiceSelected', choice)

        // 如果是单选模式，自动触发完成事件
        if (props.choiceGroup.maxSelect === 1) {
            emit('completed', props.choiceGroup.getSelectedChoices())
        }
    } catch (error) {
        console.error('[ChoiceContainer] 选择失败:', error)
    }
}

/**
 * 处理确认按钮点击
 */
async function handleConfirm() {
    if (!props.choiceGroup.canComplete()) {
        return
    }

    try {
        await props.choiceGroup.complete()
        emit('completed', props.choiceGroup.getSelectedChoices())
    } catch (error) {
        console.error('[ChoiceContainer] 完成选择失败:', error)
    }
}
</script>

<style scoped lang='scss'>
.choice-container {
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.choice-header {
    text-align: center;
}

.choice-title {
    font-size: 2rem;
    margin: 0 0 1rem 0;
}

.choice-description {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
}

.choice-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.choice-item {
    border: 2px solid black;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &.choice-available:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.choice-selected {
        background: rgba(0, 128, 0, 0.1);
        border-color: green;
    }

    &.choice-locked,
    &.choice-disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.choice-default {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    position: relative;
}

.choice-icon {
    font-size: 3rem;
    min-width: 4rem;
    text-align: center;
}

.choice-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.choice-name {
    font-size: 1.5rem;
    font-weight: bold;
}

.choice-desc {
    font-size: 1rem;
    color: #666;
}

.choice-selected-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    color: green;
}

.choice-actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.confirm-button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: 2px solid black;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>
