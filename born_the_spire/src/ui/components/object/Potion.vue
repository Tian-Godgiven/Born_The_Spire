<template>
<div class="potion-wrapper" ref="wrapperRef">
    <!-- 有药水时 -->
    <ChooseSource
        v-if="potion"
        ref="chooseSourceRef"
        :on-success="onUseSuccess"
        @click.left="handleLeftClick"
    >
        <div
            class="potion-display"
            :class="{ 'can-use': canUse }"
            @contextmenu.prevent="handleRightClick"
            @mouseenter="showDesc"
            @mouseleave="hideDesc"
        >
            {{ potionLabel }}
        </div>
    </ChooseSource>

    <!-- 空药水槽 -->
    <div v-else class="potion-display empty">[空]</div>

    <!-- 描述弹窗 -->
    <div v-if="potion && showDescPopover" class="potion-popover description">
        <div class="potion-name">{{ potion.label }}</div>
        <div class="potion-desc">{{ description }}</div>
    </div>

    <!-- 右键功能菜单 -->
    <div v-if="potion && showMenuPopover" class="potion-popover menu">
        <!-- 使用选项 -->
        <div
            v-for="(use, index) in potion.useInteractions"
            :key="index"
            class="menu-item"
            @click="handleUse(index)"
        >
            {{ use.label || '使用' }}
        </div>
        <!-- 丢弃选项 -->
        <div
            v-if="potion.canDrop"
            class="menu-item"
            @click="handleDiscard"
        >
            丢弃
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, onMounted, onBeforeUnmount } from 'vue'
import type { Potion } from '@/core/objects/item/Subclass/Potion'
import { usePotion, discardPotion } from '@/core/objects/item/Subclass/Potion'
import { nowPlayer } from '@/core/objects/game/run'
import type { Target } from '@/core/objects/target/Target'
import { getDescribe } from '@/ui/hooks/express/describe'
import ChooseSource from '@/ui/components/interaction/chooseTarget/ChooseSource.vue'

const props = defineProps<{
    potion: Potion | null
}>()

const wrapperRef = useTemplateRef('wrapperRef')
const chooseSourceRef = useTemplateRef('chooseSourceRef')
const showDescPopover = ref(false)
const showMenuPopover = ref(false)
const currentUseIndex = ref(0)

// 药水显示标签
const potionLabel = computed(() => {
    return props.potion ? `[${props.potion.label}]` : '[空]'
})

// 药水描述
const description = computed(() => {
    if (!props.potion || !props.potion.describe) return ''
    return getDescribe(props.potion.describe, props.potion)
})

// 是否可以使用
const canUse = computed(() => {
    return props.potion && props.potion.useInteractions.length > 0
})

// 左键点击：使用第一个 use 交互
function handleLeftClick() {
    if (!props.potion || !canUse.value) return
    if (!chooseSourceRef.value) return

    currentUseIndex.value = 0
    const firstUse = props.potion.useInteractions[0]
    if (!firstUse) return

    // 隐藏描述
    showDescPopover.value = false

    // 开始选择目标
    chooseSourceRef.value.startChoose({
        targetType: firstUse.target
    })
}

// 右键点击：显示功能菜单
function handleRightClick(event: MouseEvent) {
    if (!props.potion) return

    event.preventDefault()
    event.stopPropagation()

    // 隐藏描述
    showDescPopover.value = false
    // 显示菜单
    showMenuPopover.value = true
}

// 显示描述
function showDesc() {
    if (!showMenuPopover.value) {
        showDescPopover.value = true
    }
}

// 隐藏描述
function hideDesc() {
    showDescPopover.value = false
}

// 处理使用指定索引的 use 交互
function handleUse(index: number) {
    if (!props.potion) return
    if (!chooseSourceRef.value) return

    currentUseIndex.value = index
    const use = props.potion.useInteractions[index]
    if (!use) return

    // 关闭菜单
    showMenuPopover.value = false

    // 开始选择目标
    chooseSourceRef.value.startChoose({
        targetType: use.target
    })
}

// 选择目标成功后，调用使用药水
function onUseSuccess(targets: Target[]) {
    if (!props.potion) return

    usePotion(nowPlayer, props.potion, currentUseIndex.value, targets)
}

// 处理丢弃
function handleDiscard() {
    if (!props.potion) return

    // 关闭菜单
    showMenuPopover.value = false

    // 丢弃药水
    discardPotion(nowPlayer, props.potion)
}

// 点击外部关闭菜单
function handleClickOutside(event: MouseEvent) {
    if (!wrapperRef.value) return

    const target = event.target as HTMLElement
    if (!wrapperRef.value.contains(target)) {
        showMenuPopover.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.potion-wrapper {
    display: inline-block;
    position: relative;
}

.potion-display {
    background: white;
    cursor: default;
    user-select: none;
    text-align: center;

    &.can-use {
        cursor: pointer;
    }

    &.empty {
        color: #999;
    }
}

.potion-popover {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    background: white;
    border: 2px solid black;
    padding: 8px;
    z-index: 9999;
    min-width: 200px;

    &.description {
        .potion-name {
            font-weight: bold;
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid #ccc;
        }

        .potion-desc {
            white-space: pre-wrap;
            line-height: 1.4;
        }
    }

    &.menu {
        min-width: 120px;

        .menu-item {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee;

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
        }
    }
}
</style>
