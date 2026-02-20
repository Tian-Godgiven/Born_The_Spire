<template>
<div class="popover-wrapper" ref="triggerRef">
    <!-- 触发器插槽 -->
    <slot name="trigger" :toggle="toggle" :open="open" :close="close"></slot>

    <!-- Popover 内容（渲染到 body） -->
    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="popoverRef"
            class="popover-content"
            :style="popoverStyle"
        >
            <slot></slot>
        </div>
    </Teleport>
</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface Props {
    modelValue?: boolean
    placement?: Placement
    closeOnClickOutside?: boolean
    offset?: number
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    placement: 'bottom',
    closeOnClickOutside: true,
    offset: 8
})

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

const triggerRef = ref<HTMLElement>()
const popoverRef = ref<HTMLElement>()
const isOpen = ref(props.modelValue)

// 同步 v-model
watch(() => props.modelValue, (val) => {
    isOpen.value = val
})

watch(isOpen, (val) => {
    emit('update:modelValue', val)
    if (val) {
        nextTick(() => {
            updatePosition()
            if (props.closeOnClickOutside) {
                document.addEventListener('click', handleClickOutside)
            }
        })
    } else {
        document.removeEventListener('click', handleClickOutside)
    }
})

// Popover 位置计算
const popoverStyle = ref<Record<string, string>>({})

function updatePosition() {
    if (!triggerRef.value || !popoverRef.value) return

    const triggerRect = triggerRef.value.getBoundingClientRect()
    const popoverRect = popoverRef.value.getBoundingClientRect()

    let top = 0
    let left = 0

    switch (props.placement) {
        case 'top':
            top = triggerRect.top - popoverRect.height - props.offset
            left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
            break
        case 'bottom':
            top = triggerRect.bottom + props.offset
            left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
            break
        case 'left':
            top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
            left = triggerRect.left - popoverRect.width - props.offset
            break
        case 'right':
            top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
            left = triggerRect.right + props.offset
            break
    }

    // 边界检查，防止超出视口
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < 0) left = 0
    if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width
    }
    if (top < 0) top = 0
    if (top + popoverRect.height > viewportHeight) {
        top = viewportHeight - popoverRect.height
    }

    popoverStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: '9999'
    }
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node
    if (
        triggerRef.value &&
        popoverRef.value &&
        !triggerRef.value.contains(target) &&
        !popoverRef.value.contains(target)
    ) {
        close()
    }
}

// 公开的方法
function toggle() {
    isOpen.value = !isOpen.value
}

function open() {
    isOpen.value = true
}

function close() {
    isOpen.value = false
}

// 监听窗口大小变化，更新位置
function handleResize() {
    if (isOpen.value) {
        updatePosition()
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleResize, true)
    document.removeEventListener('click', handleClickOutside)
})

defineExpose({
    toggle,
    open,
    close
})
</script>

<style scoped lang="scss">
.popover-wrapper {
    display: inline-block;
}

.popover-content {
    background: white;
    border: 2px solid black;
    padding: 8px;
    min-width: 100px;
}
</style>
