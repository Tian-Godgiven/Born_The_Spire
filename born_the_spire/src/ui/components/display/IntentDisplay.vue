<template>
<div class="intent-display" v-if="intent">
    <!-- 意图图标和值 -->
    <div class="intent-main" :class="intentTypeClass">
        <!-- 意图类型图标 -->
        <div class="intent-icon">
            {{ intentIcon }}
        </div>

        <!-- 意图值 -->
        <div class="intent-value" v-if="showValue">
            {{ displayValue }}
        </div>

        <!-- 多段攻击次数 -->
        <div class="intent-count" v-if="intent.count && intent.count > 1">
            ×{{ intent.count }}
        </div>
    </div>

    <!-- 悬停显示详情 -->
    <div class="intent-tooltip" v-if="showTooltip">
        <div class="tooltip-header">
            {{ intentLabel }}
        </div>
        <div class="tooltip-content">
            <div v-if="intent.value !== undefined">
                {{ intentDescription }}
            </div>
            <div v-if="intent.count && intent.count > 1" class="tooltip-count">
                攻击 {{ intent.count }} 次
            </div>
            <div class="tooltip-visibility" v-if="intent.visibility !== 'exact'">
                {{ visibilityHint }}
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Intent } from '@/core/objects/system/Intent'

const props = defineProps<{
    intent?: Intent
}>()

const showTooltip = ref(false)

// 意图类型对应的 CSS 类
const intentTypeClass = computed(() => {
    if (!props.intent) return ''
    return `intent-${props.intent.type}`
})

// 意图图标
const intentIcon = computed(() => {
    if (!props.intent) return ''

    switch (props.intent.type) {
        case 'attack':
            return '⚔️'
        case 'defend':
            return '🛡️'
        case 'buff':
            return '↑'
        case 'debuff':
            return '↓'
        case 'special':
            return '✨'
        case 'unknown':
        default:
            return '?'
    }
})

// 意图标签
const intentLabel = computed(() => {
    if (!props.intent) return ''

    switch (props.intent.type) {
        case 'attack':
            return '攻击'
        case 'defend':
            return '防御'
        case 'buff':
            return '增益'
        case 'debuff':
            return '减益'
        case 'special':
            return '特殊'
        case 'unknown':
        default:
            return '未知'
    }
})

// 是否显示数值
const showValue = computed(() => {
    if (!props.intent) return false
    if (props.intent.visibility === 'hidden') return false
    if (props.intent.visibility === 'type') return false
    return props.intent.value !== undefined
})

// 显示的值
const displayValue = computed(() => {
    if (!props.intent || props.intent.value === undefined) return ''

    if (props.intent.visibility === 'range') {
        // 范围显示（简化：显示 ±20%）
        const min = Math.floor(props.intent.value * 0.8)
        const max = Math.ceil(props.intent.value * 1.2)
        return `${min}-${max}`
    }

    // exact 或默认：显示精确值
    return props.intent.value.toString()
})

// 意图描述
const intentDescription = computed(() => {
    if (!props.intent) return ''

    const value = displayValue.value

    switch (props.intent.type) {
        case 'attack':
            return `造成 ${value} 点伤害`
        case 'defend':
            return `获得 ${value} 点格挡`
        case 'buff':
            return `增益效果（${value}）`
        case 'debuff':
            return `减益效果（${value}）`
        case 'special':
            return `特殊行动`
        default:
            return '未知行动'
    }
})

// 可见性提示
const visibilityHint = computed(() => {
    if (!props.intent) return ''

    switch (props.intent.visibility) {
        case 'hidden':
            return '（意图未知）'
        case 'type':
            return '（具体数值未知）'
        case 'range':
            return '（数值为估算范围）'
        default:
            return ''
    }
})
</script>

<style scoped lang="scss">
.intent-display {
    position: relative;
    display: inline-block;

    &:hover .intent-tooltip {
        display: block;
    }
}

.intent-main {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 2px solid black;
    background: white;
    min-width: 50px;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    // 意图类型颜色
    &.intent-attack {
        border-color: #d32f2f;
        .intent-icon {
            color: #d32f2f;
        }
    }

    &.intent-defend {
        border-color: #1976d2;
        .intent-icon {
            color: #1976d2;
        }
    }

    &.intent-buff {
        border-color: #388e3c;
        .intent-icon {
            color: #388e3c;
        }
    }

    &.intent-debuff {
        border-color: #f57c00;
        .intent-icon {
            color: #f57c00;
        }
    }

    &.intent-special {
        border-color: #7b1fa2;
        .intent-icon {
            color: #7b1fa2;
        }
    }

    &.intent-unknown {
        border-color: #616161;
        .intent-icon {
            color: #616161;
        }
    }

    &:hover {
        transform: scale(1.05);
    }

    .intent-icon {
        font-size: 20px;
        line-height: 1;
    }

    .intent-value {
        font-weight: bold;
        font-size: 16px;
    }

    .intent-count {
        font-size: 12px;
        color: #666;
    }
}

// 意图改变动画
@keyframes intent-change {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0;
        transform: scale(0.8);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

.intent-changing {
    animation: intent-change 0.6s ease;
}

// 工具提示
.intent-tooltip {
    display: none;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    background: white;
    border: 2px solid black;
    padding: 8px 12px;
    min-width: 150px;
    z-index: 1000;
    pointer-events: none;

    .tooltip-header {
        font-weight: bold;
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px solid #ccc;
    }

    .tooltip-content {
        font-size: 13px;
        line-height: 1.4;

        .tooltip-count {
            margin-top: 4px;
            color: #666;
        }

        .tooltip-visibility {
            margin-top: 4px;
            font-size: 11px;
            color: #999;
            font-style: italic;
        }
    }
}
</style>
