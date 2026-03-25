<template>
<div class="relic"
    :class="{ 'has-abilities': hasActiveAbilities, 'is-disabled': relic.isDisabled }"
    ref="relicRef"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick">

    <!-- 主动能力标识 -->
    <div class="ability-indicator" v-if="hasActiveAbilities">
        ⚡
    </div>

    <!-- 冷却角标 -->
    <div class="cooldown-badge" v-if="cooldownValue !== null">
        {{ cooldownValue > 0 ? cooldownValue : '✓' }}
    </div>

    <!-- 点数角标 -->
    <div class="point-badge" v-if="pointValue !== null">
        {{ pointValue }}
    </div>

    <div>{{ relic.label }}</div>

    <!-- 遗物详情悬浮框 -->
    <Teleport to="body">
        <div
            v-if="showDetail"
            ref="tooltipRef"
            class="relic-tooltip"
            :style="tooltipStyle"
        >
            <div class="tooltip-header">
                <span class="relic-name">{{ relic.label }}</span>
                <span class="relic-rarity" v-if="relic.rarity">[{{ rarityText }}]</span>
            </div>
            <div class="tooltip-body">
                <div class="relic-description">
                    {{ getDescribe(relic.describe, relic) }}
                </div>
                <div class="relic-abilities" v-if="hasActiveAbilities">
                    <div class="abilities-title">主动能力：</div>
                    <div v-for="(ability, index) in relic.activeAbilities" :key="index" class="ability-item">
                        <div class="ability-label">{{ ability.label }}</div>
                        <div class="ability-desc">{{ getDescribe(ability.describe, relic) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script setup lang='ts'>
    import { Relic } from '@/core/objects/item/Subclass/Relic';
    import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
    import { handleItemRightClick } from '@/core/hooks/activeAbility';
    import { nowPlayer } from '@/core/objects/game/run';
    import { getDescribe } from '@/ui/hooks/express/describe';
    import { showRelicList } from '@/ui/interaction/relicList';

    const {relic} = defineProps<{relic:Relic}>()

    const relicRef = ref<HTMLElement>()
    const tooltipRef = ref<HTMLElement>()
    const showDetail = ref(false)
    const tooltipStyle = ref<Record<string, string>>({})

    const hasActiveAbilities = computed(() => {
        return relic.activeAbilities && relic.activeAbilities.length > 0
    })

    const cooldownValue = computed(() => {
        if (!relic.status || !relic.status["cooldown"]) return null
        return relic.status["cooldown"].value
    })

    const pointValue = computed(() => {
        if (!relic.status || !relic.status["point"]) return null
        const point = relic.status["point"].value
        const maxPoint = relic.status["maxPoint"]?.value
        if (maxPoint !== undefined) {
            return `${point}/${maxPoint}`
        }
        return point
    })

    const rarityText = computed(() => {
        const rarityMap = {
            'common': '普通',
            'uncommon': '稀有',
            'rare': '史诗'
        }
        return rarityMap[relic.rarity || 'common']
    })

    function handleMouseEnter() {
        showDetail.value = true
        nextTick(() => {
            updateTooltipPosition()
        })
    }

    function handleMouseLeave() {
        showDetail.value = false
    }

    function updateTooltipPosition() {
        if (!relicRef.value || !tooltipRef.value) return

        const relicRect = relicRef.value.getBoundingClientRect()
        const tooltipRect = tooltipRef.value.getBoundingClientRect()

        // 默认显示在下方
        let left = relicRect.left
        let top = relicRect.bottom + 8

        // 边界检查
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // 如果右侧空间不足，向左对齐
        if (left + tooltipRect.width > viewportWidth) {
            left = relicRect.right - tooltipRect.width
        }

        // 如果左侧也不够，强制调整
        if (left < 0) {
            left = 8
        }

        // 如果下方空间不足，显示在上方
        if (top + tooltipRect.height > viewportHeight) {
            top = relicRect.top - tooltipRect.height - 8
        }

        // 如果上方也不够，强制显示在下方
        if (top < 0) {
            top = relicRect.bottom + 8
            if (top + tooltipRect.height > viewportHeight) {
                top = viewportHeight - tooltipRect.height - 8
            }
        }

        tooltipStyle.value = {
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: '10000'
        }
    }

    function handleClick() {
        showRelicList(relic)
    }

    async function handleRightClick() {
        if (!hasActiveAbilities.value) return

        try {
            // 为遗物提供默认的右键触发配置
            const triggerConfig = {
                rightClick: {
                    type: "menu" as const
                }
            }

            // 如果只有一个能力，直接执行；否则显示菜单
            const abilities = relic.activeAbilities!
            let menuConfig

            if (abilities.length === 1) {
                // 单能力：直接执行
                triggerConfig.rightClick.type = "ability"
                triggerConfig.rightClick.abilityKey = abilities[0].key
            } else {
                // 多能力：显示菜单
                menuConfig = {
                    items: abilities.map(ability => ({
                        type: "ability" as const,
                        abilityKey: ability.key,
                        label: ability.label,
                        describe: ability.describe,
                        canUse: () => true
                    }))
                }
            }

            await handleItemRightClick(
                relic,
                nowPlayer,
                abilities,
                triggerConfig,
                menuConfig
            )
        } catch (error) {
            console.error('[Relic] 右键点击处理失败:', error)
        }
    }
</script>

<style scoped lang='scss'>
.relic {
    position: relative;
    border: 2px solid black;
    padding: 8px;
    cursor: pointer;

    &.has-abilities {
        border-color: #3b82f6;

        &:hover {
            border-color: #1d4ed8;
            background: #eff6ff;
        }
    }

    .ability-indicator {
        position: absolute;
        top: -2px;
        left: -2px;
        background-color: #3b82f6;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 0 0 4px 0;
        z-index: 1;
    }

    .cooldown-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        background-color: #666;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 4px 0 0 0;
        z-index: 1;
        min-width: 12px;
        text-align: center;
    }

    .point-badge {
        position: absolute;
        bottom: -2px;
        left: -2px;
        background-color: #e67e22;
        color: white;
        font-size: 10px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 0 4px 0 0;
        z-index: 1;
        min-width: 12px;
        text-align: center;
    }

    &.is-disabled {
        opacity: 0.4;
        cursor: not-allowed;
        text-decoration: line-through;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.relic-tooltip {
    background: white;
    border: 2px solid black;
    min-width: 200px;
    max-width: 350px;
    pointer-events: none;

    .tooltip-header {
        padding: 8px 12px;
        border-bottom: 2px solid black;
        display: flex;
        align-items: center;
        gap: 8px;

        .relic-name {
            font-weight: bold;
            font-size: 14px;
        }

        .relic-rarity {
            font-size: 12px;
            color: #666;
        }
    }

    .tooltip-body {
        padding: 8px 12px;

        .relic-description {
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .relic-abilities {
            border-top: 1px solid #ccc;
            padding-top: 8px;
            margin-top: 8px;

            .abilities-title {
                font-weight: bold;
                margin-bottom: 6px;
                font-size: 12px;
            }

            .ability-item {
                margin-bottom: 6px;
                padding: 6px;
                border: 1px solid #ccc;
                background: #f9f9f9;

                &:last-child {
                    margin-bottom: 0;
                }

                .ability-label {
                    font-weight: bold;
                    margin-bottom: 2px;
                    font-size: 12px;
                }

                .ability-desc {
                    font-size: 11px;
                    color: #666;
                    line-height: 1.4;
                }
            }
        }
    }
}
</style>