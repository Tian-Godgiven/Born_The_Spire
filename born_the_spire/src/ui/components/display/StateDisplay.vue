<template>
<!-- 纯展示组件：定位由使用方负责，这样多个浮层能被统一排布成并列的列 -->
<div class="state-popover" :class="{ embedded }" v-if="hasStates">
    <div class="popover-header" v-if="!embedded">
        状态效果
    </div>
    <div class="popover-content">
        <div v-for="state in states" :key="state.key" class="state-item">
            <div class="state-header">
                <span class="state-label">{{ state.label }}</span>
                <span class="state-stack" v-if="hasVisibleStack(state)">
                    {{ getStackDisplay(state) }}
                </span>
            </div>
            <div class="state-description">
                <template v-for="(part, index) in state.describe" :key="index">
                    <span v-if="typeof part === 'string'">{{ part }}</span>
                    <span v-else class="dynamic-value">{{ resolveDynamicValue(part, state) }}</span>
                </template>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Entity } from '@/core/objects/system/Entity'
import type { State } from '@/core/objects/system/State'
import { getStateModifier } from '@/core/objects/system/modifier/StateModifier'

// target 放宽到 Entity：器官、卡牌也能挂状态（器官内部计数），不只角色
const props = defineProps<{
    target: Entity
    // 嵌进别的面板时去掉自己的边框和标题，避免套成盒中盒
    embedded?: boolean
}>()

const stateModifier = computed(() => getStateModifier(props.target))

// hidden 的是纯记账计数（如判定次数），对玩家没有决策价值，不显示
const states = computed(() => stateModifier.value.states.value.filter(state => !state.hidden))

const hasStates = computed(() => states.value.length > 0)

// 检查状态是否有可见的层数
function hasVisibleStack(state: State): boolean {
    return state.stacks.some(stack => stack.showType !== "bool")
}

// 获取层数显示
function getStackDisplay(state: State): string {
    const visibleStacks = state.stacks.filter(stack => stack.showType !== "bool")
    if (visibleStacks.length === 0) return ''
    if (visibleStacks.length === 1) {
        return `${visibleStacks[0].stack}`
    }
    // 多个层数
    return visibleStacks.map(s => `${s.key}:${s.stack}`).join(' ')
}

// 解析动态值（用于 describe 中的 {key:...} 部分）
function resolveDynamicValue(part: any, _state: State): string {
    if (!part.key || !Array.isArray(part.key)) return ''

    const [type, ...rest] = part.key

    if (type === 'status') {
        // 从状态的属性中获取值
        const key = rest[0]
        // 这里简化处理，直接返回占位符
        // 实际可能需要从 state 的某个地方读取
        return `[${key}]`
    }

    return ''
}
</script>

<style scoped lang="scss">
.state-popover {
    background: white;
    border: 2px solid black;
    padding: 8px;
    min-width: 180px;
    max-width: 250px;
    box-sizing: border-box;

    &.embedded {
        background: rgba(0, 0, 0, 0.02);
        border: none;
        min-width: 0;
        max-width: none;
        padding: 8px;
    }

    .popover-header {
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 2px solid black;
    }

    .popover-content {
        .state-item {
            padding: 6px 0;

            &:not(:last-child) {
                border-bottom: 1px solid #ccc;
            }

            .state-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .state-label {
                    font-weight: bold;
                }

                .state-stack {
                    background: black;
                    color: white;
                    padding: 2px 6px;
                    font-size: 0.9em;
                    min-width: 20px;
                    text-align: center;
                }
            }

            .state-description {
                font-size: 0.85em;
                color: #333;
                line-height: 1.4;

                .dynamic-value {
                    font-weight: bold;
                }
            }
        }
    }
}
</style>
