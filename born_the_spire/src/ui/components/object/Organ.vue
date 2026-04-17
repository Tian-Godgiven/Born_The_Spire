<template>
<div class="organ"
    :class="{ 'temporary': organ.isTemporary, 'has-abilities': hasActiveAbilities, 'disabled': disabled }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @click="showDetail = true"
    @contextmenu.prevent="handleRightClick">

    <!-- 自动角标：临时标识 -->
    <div class="badge top-right auto-temporary" v-if="organ.isTemporary">
        临时
    </div>

    <!-- 自动角标：主动能力标识 -->
    <div class="badge top-left auto-ability" v-if="hasActiveAbilities">
        ⚡
    </div>

    <!-- 禁用标识 -->
    <div class="disabled-indicator" v-if="disabled">
        ×
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

    {{ organ.label }}:{{ describe }}

    <!-- 词条显示 -->
    <EntryDisplay
        v-if="hovering"
        :entries="organ.entry"
        :side="side ?? 'right'" />

    <!-- 器官详情弹窗 -->
    <OrganDetail
        :organ="organ"
        :visible="showDetail"
        @close="showDetail = false"
    />
</div>
</template>

<script setup lang='ts'>
    import { getDescribe } from '@/ui/hooks/express/describe';
import { Organ } from '@/core/objects/target/Organ';
import { computed, ref } from 'vue';
import EntryDisplay from '@/ui/components/display/EntryDisplay.vue';
import OrganDetail from '@/ui/components/interaction/OrganDetail.vue';
import { handleItemRightClick } from '@/core/hooks/activeAbility';
import { nowPlayer } from '@/core/objects/game/run';
import { resolveBadges } from '@/core/utils/badgeResolver';
import { nowBattle } from '@/core/objects/game/battle';
import type { BadgeRenderData, BadgePosition } from '@/core/types/BadgeConfig';

    const {organ, side, disabled = false} = defineProps<{
        organ: Organ
        side?: 'left' | 'right'  // 可选，默认右侧
        disabled?: boolean  // 是否被禁用
    }>()

    const hovering = ref(false)
    const showDetail = ref(false)

    const describe = computed(()=>{
        return getDescribe(organ.describe, organ)
    })

    const hasActiveAbilities = computed(() => {
        return organ.activeAbilities && organ.activeAbilities.length > 0
    })

    // 统一角标计算
    const resolvedBadges = computed(() => {
        const badges = organ.badges
        if (!badges || badges.length === 0) return []
        return resolveBadges(organ, nowPlayer, badges, { battle: nowBattle.value })
    })

    // 按位置分组
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

    async function handleRightClick() {
        if (!hasActiveAbilities.value || disabled) return

        try {
            await handleItemRightClick(
                organ,
                nowPlayer,
                organ.activeAbilities!
            )
        } catch (error) {
            console.error('[Organ] 右键点击处理失败:', error)
        }
    }
</script>

<style scoped lang='scss'>
.organ{
    position: relative;  // 为 EntryDisplay 提供定位上下文
    width: 100px;
    border: 2px solid black;
    cursor: pointer;

    // 临时器官样式
    &.temporary {
        border-style: dashed;
        border-color: #f59e0b;
        background-color: #fffbeb;
    }

    // 有主动能力的器官样式
    &.has-abilities {
        border-color: #3b82f6;

        &:hover {
            border-color: #1d4ed8;
        }
    }

    // 自动角标：临时
    .badge.auto-temporary {
        position: absolute;
        top: -2px;
        right: -2px;
        background-color: #f59e0b;
        color: white;
        font-size: 8px;
        padding: 1px 3px;
        font-weight: bold;
        border-radius: 0 0 0 4px;
        z-index: 1;
    }

    // 自动角标：主动能力
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

    // 角标组
    .badge-group {
        position: absolute;
        display: flex;
        gap: 1px;
        z-index: 1;

        &.top-left {
            top: -2px;
            left: -2px;

            .badge { border-radius: 0 0 4px 0; }
        }

        &.top-right {
            top: -2px;
            right: -2px;

            .badge { border-radius: 0 0 0 4px; }
        }

        &.bottom-left {
            bottom: -2px;
            left: -2px;

            .badge { border-radius: 0 4px 0 0; }
        }

        &.bottom-right {
            bottom: -2px;
            right: -2px;

            .badge { border-radius: 4px 0 0 0; }
        }

        .badge {
            font-size: 10px;
            padding: 1px 3px;
            font-weight: bold;
            min-width: 12px;
            text-align: center;
        }
    }

    .disabled-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: #dc2626;
        font-weight: bold;
        pointer-events: none;
        z-index: 2;
        opacity: 0.8;
    }

    // 禁用状态的器官样式
    &.disabled {
        opacity: 0.5;
        background: #fef2f2;
        border-color: #dc2626;
        cursor: not-allowed;
        text-decoration: line-through;

        &:hover {
            background: #fee2e2;
        }
    }

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.temporary:hover {
        background: #fef3c7;
    }

    &.has-abilities:hover {
        background: #eff6ff;
    }

    &.temporary.has-abilities:hover {
        background: linear-gradient(45deg, #fef3c7 50%, #eff6ff 50%);
    }
}
</style>
