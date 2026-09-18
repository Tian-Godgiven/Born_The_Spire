<template>
<Popover v-if="intent" placement="bottom" align="center" :max-width="600">
    <div class="intent-row">
        <div
            v-for="(part, index) in parts"
            :key="index"
            class="intent-main"
            :class="'intent-' + part.type"
        >
            <div class="intent-icon">
                {{ iconFor(part.type) }}
            </div>
            <div class="intent-value" v-if="showValue(part)">
                {{ displayValue(part) }}
            </div>
            <div class="intent-count" v-if="part.count && part.count > 1">
                ×{{ part.count }}
            </div>
        </div>
    </div>

    <template #content>
        <div class="tooltip-content">
            <div v-if="intent.visibility !== 'card' && partDescriptions.length">
                <div v-for="(text, index) in partDescriptions" :key="index">
                    {{ text }}
                </div>
            </div>

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
import type { Intent, IntentPart, IntentType } from '@/core/objects/system/Intent'
import Card from '@/ui/components/object/Card.vue'
import Popover from '@/ui/components/global/Popover.vue'

const props = defineProps<{
    intent?: Intent
}>()

const parts = computed<IntentPart[]>(() => {
    if (!props.intent) return []
    if (props.intent.visibility === 'hidden') return [{ type: 'unknown' }]
    if (props.intent.parts?.length) return props.intent.parts
    return [{ type: props.intent.type, value: props.intent.value, count: props.intent.count }]
})

function iconFor(type: IntentType): string {
    switch (type) {
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
        case 'heal':
            return '+'
        case 'unknown':
        default:
            return '?'
    }
}

function showValue(part: IntentPart): boolean {
    if (!props.intent) return false
    if (props.intent.visibility === 'hidden') return false
    if (props.intent.visibility === 'type') return false
    return part.value !== undefined
}

function displayValue(part: IntentPart): string {
    if (part.value === undefined) return ''
    if (props.intent?.visibility === 'range') {
        const min = Math.floor(part.value * 0.8)
        const max = Math.ceil(part.value * 1.2)
        return `${min}-${max}`
    }
    return part.value.toString()
}

function describePart(part: IntentPart): string {
    const value = displayValue(part)
    switch (part.type) {
        case 'attack':
            return `造成 ${value} 点伤害`
        case 'defend':
            return `获得 ${value} 点格挡`
        case 'buff':
            return value ? `增益效果（${value}）` : '增益效果'
        case 'debuff':
            return value ? `减益效果（${value}）` : '减益效果'
        case 'heal':
            return value ? `回复 ${value} 点生命` : '治疗'
        case 'special':
            return '特殊行动'
        default:
            return '未知行动'
    }
}

const partDescriptions = computed(() => {
    if (!props.intent || props.intent.visibility === 'card') return []
    return parts.value
        .filter(part => part.value !== undefined || part.type === 'buff' || part.type === 'debuff' || part.type === 'special')
        .map(describePart)
})

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
.intent-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.intent-main {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--layout-intent-main-padding, 6px 10px);
    border: 2px solid black;
    background: white;
    min-width: var(--layout-intent-main-min-width, 50px);
    justify-content: center;
    cursor: pointer;

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

    &.intent-heal {
        border-color: #44cc44;
        .intent-icon {
            color: #44cc44;
        }
    }

    &.intent-unknown {
        border-color: #616161;
        .intent-icon {
            color: #616161;
        }
    }

    .intent-icon {
        font-size: var(--layout-intent-icon-size, 20px);
        line-height: 1;
    }

    .intent-value {
        font-weight: bold;
        font-size: var(--layout-intent-value-size, 16px);
    }

    .intent-count {
        font-size: 12px;
        color: #666;
    }
}

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

.tooltip-content {
    font-size: var(--layout-intent-tooltip-size, 16px);
    white-space: normal;

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
