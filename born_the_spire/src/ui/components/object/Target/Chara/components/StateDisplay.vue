<template>
<div class="state-display-container">
    <!-- 状态详情弹窗 -->
    <div
        v-if="hasStates"
        class="state-popover"
        :class="side"
    >
        <div class="popover-header">
            状态效果
        </div>
        <div class="popover-content">
            <div v-for="state in target.state" :key="state.key" class="state-item">
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
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Target } from '@/core/objects/target/Target'
import type { State } from '@/core/objects/system/State'

const props = defineProps<{
    target: Target
    side: 'left' | 'right'  // 显示在左侧还是右侧
}>()

// 是否有状态
const hasStates = computed(() => {
    return props.target.state && props.target.state.length > 0
})

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
function resolveDynamicValue(part: any, state: State): string {
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
.state-display-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;  // 不阻止鼠标事件
}

.state-popover {
    position: absolute;
    top: 0;
    background: white;
    border: 2px solid black;
    padding: 8px;
    min-width: 180px;
    max-width: 250px;
    z-index: 1000;
    pointer-events: auto;  // 弹窗本身可以接收事件

    &.left {
        left: 0;
        transform: translateX(calc(-100% - 8px));  // 向左移动自身宽度+间距
    }

    &.right {
        right: 0;
        transform: translateX(calc(100% + 8px));  // 向右移动自身宽度+间距
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
