<template>
<Popover v-if="intent" placement="bottom" align="center" :max-width="600">
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
    <template #content>
        <div class="tooltip-content">
            <!-- 显示值的描述（非 card 模式） -->
            <div v-if="intent.value !== undefined && intent.visibility !== 'card'">
                {{ intentDescription }}
            </div>

            <!-- card 级别：悬停显示卡牌详情 -->
            <div v-if="intent.visibility === 'card'" class="tooltip-card-list">
                <Card v-for="card in intent.actions" :key="card.key" :card="card" />
            </div>

            <div class="tooltip-visibility" v-if="intent.visibility !== 'exact' && intent.visibility !== 'card'">
                {{ visibilityHint }}
            </div>
        </div>
    </template>
</Popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Intent } from '@/core/objects/system/Intent'
import Card from '@/ui/components/object/Card.vue'
import Popover from '@/ui/components/global/Popover.vue'

const props = defineProps<{
    intent?: Intent
}>()

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

// 是否显示数值/卡牌名称
const showValue = computed(() => {
    if (!props.intent) return false
    if (props.intent.visibility === 'hidden') return false
    if (props.intent.visibility === 'type') return false
    // card 模式同 exact，显示类型+数值，悬停时再显示卡牌详情
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

    // exact 或 card 模式：显示精确值
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
        case 'card':
            return '（显示具体卡牌）'
        default:
            return ''
    }
})
</script>

<style scoped lang="scss">
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

// 浮层挂在 Chara 的意图容器下，那个容器为了小徽章设了 12px + nowrap，
// 这里必须重置回正常排版，否则浮层里的卡牌字会变小且不换行
.tooltip-content {
    font-size: 16px;
    white-space: normal;

    // card 模式下的卡牌列表
    .tooltip-card-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .tooltip-visibility {
        margin-top: 4px;
        font-size: 11px;
        color: #999;
        font-style: italic;
    }
}
</style>
