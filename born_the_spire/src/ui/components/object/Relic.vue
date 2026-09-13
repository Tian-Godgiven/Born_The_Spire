<template>
<div class="relic"
    :class="{ 'has-abilities': hasActiveAbilities, 'is-disabled': relic.isDisabled || isUsedUp }"
    ref="relicRef"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick">

    <!-- 角标（预览模式隐藏） -->
    <template v-if="!preview">
        <!-- 自动角标：主动能力标识 -->
        <div class="badge top-left auto-ability" v-if="hasActiveAbilities">
            ⚡
        </div>

        <!-- 统一角标渲染 -->
        <template v-for="(group, position) in badgesByPosition" :key="position">
            <div class="badge-group" :class="position">
                <div
                    v-for="(badge, index) in group"
                    :key="index"
                    class="badge"
                    :style="badge.style">
                    {{ badge.text }}
                </div>
            </div>
        </template>
    </template>

    <div>{{ relic.label }}</div>

    <!-- 遗物详情悬浮框：触发区是遗物本体，这里只声明浮层 -->
    <Popover
        ref="detailPopover"
        inline
        :trigger-element="relicRef"
        placement="bottom"
        align="start"
    >
        <template #content>
        <RelicHoverContent :relic="relic" />
        </template>
    </Popover>
</div>
</template>

<script setup lang='ts'>
    import { Relic } from '@/core/objects/item/Subclass/Relic';
    import { computed, ref, useTemplateRef } from 'vue';
    import Popover from '@/ui/components/global/Popover.vue';
    import RelicHoverContent from '@/ui/components/interaction/RelicHoverContent.vue';
    import { handleItemRightClick } from '@/core/hooks/activeAbility';
    import { nowPlayer } from '@/core/objects/game/run';
    import { showRelicList } from '@/ui/interaction/relicList';
    import { resolveBadges } from '@/core/utils/badgeResolver';
    import { nowBattle } from '@/core/objects/game/battle';
    import type { BadgeRenderData, BadgePosition } from '@/core/types/BadgeConfig';

    const props = defineProps<{
        relic: Relic,
        preview?: boolean  // 预览模式：隐藏角标，禁用点击/右键
    }>()

    const { relic } = props

    const relicRef = ref<HTMLElement>()
    const detailPopover = useTemplateRef<InstanceType<typeof Popover>>('detailPopover')

    const hasActiveAbilities = computed(() => {
        return relic.activeAbilities && relic.activeAbilities.length > 0
    })

    const isUsedUp = computed(() => {
        if (!relic.status || !relic.status["used"]) return false
        const used = relic.status["used"].value
        const maxUse = relic.status["maxUse"]?.value
        if (maxUse !== undefined && Number(used) >= Number(maxUse)) {
            return true
        }
        return false
    })

    // 统一角标计算
    const resolvedBadges = computed(() => {
        const badges = relic.badges
        if (!badges || badges.length === 0) return []
        return resolveBadges(relic, nowPlayer, badges, { battle: nowBattle.value })
    })

    // 按位置分组（同位置的角标在一行内依次显示）
    const badgesByPosition = computed(() => {
        const groups: Partial<Record<BadgePosition, BadgeRenderData[]>> = {}
        for (const badge of resolvedBadges.value) {
            if (!groups[badge.position]) {
                groups[badge.position] = []
            }
            groups[badge.position]!.push(badge)
        }
        return groups
    })

    function handleClick() {
        if (props.preview) return
        showRelicList(relic)
    }

    async function handleRightClick() {
        if (props.preview) return
        if (!hasActiveAbilities.value) return

        // 隐藏介绍弹窗，避免遮挡操作
        detailPopover.value?.close()

        try {
            // 如果只有一个能力，直接执行；否则显示菜单
            const abilities = relic.activeAbilities!

            if (abilities.length === 1) {
                // 单能力：直接执行 - 使用类型断言绕过编译器检查
                const triggerConfig = {
                    rightClick: {
                        type: "ability" as const,
                        abilityKey: abilities[0].key
                    }
                }
                await handleItemRightClick(
                    relic,
                    nowPlayer,
                    abilities,
                    triggerConfig,
                    undefined
                )
            } else {
                // 多能力：显示菜单
                const menuConfig = {
                    items: abilities.map(ability => ({
                        type: "ability" as const,
                        abilityKey: ability.key,
                        label: ability.label,
                        describe: ability.describe,
                        canUse: () => true
                    }))
                }
                const triggerConfig = {
                    rightClick: {
                        type: "menu" as const
                    }
                }
                await handleItemRightClick(
                    relic,
                    nowPlayer,
                    abilities,
                    triggerConfig,
                    menuConfig
                )
            }
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

    // 自动角标：主动能力标识
    .badge.auto-ability {
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

    // 角标组（同位置多个角标在一行内排列）
    .badge-group {
        position: absolute;
        display: flex;
        gap: 1px;
        z-index: 1;

        &.top-left {
            top: -2px;
            left: -2px;

            .badge:first-child { border-radius: 0 0 4px 0; }
            .badge:last-child { border-radius: 0 0 4px 0; }
        }

        &.top-right {
            top: -2px;
            right: -2px;

            .badge:first-child { border-radius: 0 0 0 4px; }
            .badge:last-child { border-radius: 0 0 0 4px; }
        }

        &.bottom-left {
            bottom: -2px;
            left: -2px;

            .badge:first-child { border-radius: 0 4px 0 0; }
            .badge:last-child { border-radius: 0 4px 0 0; }
        }

        &.bottom-right {
            bottom: -2px;
            right: -2px;

            .badge:first-child { border-radius: 4px 0 0 0; }
            .badge:last-child { border-radius: 4px 0 0 0; }
        }

        .badge {
            font-size: 10px;
            padding: 1px 3px;
            font-weight: bold;
            min-width: 12px;
            text-align: center;
        }
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
</style>
