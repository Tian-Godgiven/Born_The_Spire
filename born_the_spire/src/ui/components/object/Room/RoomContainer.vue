<template>
    <div class="room-container">
        <!-- 选择型房间：显示选择界面 -->
        <ChoiceContainer
            v-if="isChoiceRoom && choiceGroup"
            :choice-group="choiceGroup"
        />

        <!-- Vue 组件渲染 -->
        <component v-else-if="vueComponent" :is="vueComponent" :room="room" />

        <!-- HTML 渲染 -->
        <div v-else-if="htmlContent" v-html="htmlContent" class="room-html-content"></div>

        <!-- 默认渲染（无组件时） -->
        <div v-else class="room-default">
            <h2>{{ room.getDisplayName() }}</h2>
            <p>{{ room.description || '暂无描述' }}</p>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed, defineAsyncComponent, Component } from 'vue'
import { Room } from '@/core/objects/room/Room'
import { RoomSelectRoom } from '@/core/objects/room/RoomSelectRoom'
import { PoolRoom } from '@/core/objects/room/PoolRoom'
import { EventRoom } from '@/core/objects/room/EventRoom'
import { roomRegistry, RoomComponent } from '@/static/registry/roomRegistry'
import ChoiceContainer from '@/ui/components/system/ChoiceContainer.vue'

const props = defineProps<{
    room: Room
}>()

/**
 * 判断是否为房间选择房间
 */
const isRoomSelectRoom = computed(() => {
    return props.room instanceof RoomSelectRoom
})

/**
 * 判断是否为水池房间
 */
const isPoolRoom = computed(() => {
    return props.room instanceof PoolRoom
})

/**
 * 判断是否为事件房间
 */
const isEventRoom = computed(() => {
    return props.room instanceof EventRoom
})

/**
 * 判断是否为选择型房间（需要显示 ChoiceContainer）
 */
const isChoiceRoom = computed(() => {
    return isRoomSelectRoom.value || isPoolRoom.value || isEventRoom.value
})

/**
 * 获取选择型房间的 ChoiceGroup
 */
const choiceGroup = computed(() => {
    if (isRoomSelectRoom.value) {
        return (props.room as RoomSelectRoom).getChoiceGroup()
    }
    if (isPoolRoom.value) {
        return (props.room as PoolRoom).getChoiceGroup()
    }
    if (isEventRoom.value) {
        return (props.room as EventRoom).getChoiceGroup()
    }
    return null
})

/**
 * 获取房间组件
 */
const roomComponent = computed<RoomComponent | undefined>(() => {
    return roomRegistry.getRoomComponent(props.room)
})

/**
 * Vue 组件
 */
const vueComponent = computed<Component | undefined>(() => {
    const comp = roomComponent.value

    if (!comp) {
        return undefined
    }

    // 如果是 Vue 组件实例，直接返回
    if (typeof comp === 'object' && 'setup' in comp) {
        return comp as Component
    }

    // 如果是对象且有 path 属性，动态加载组件
    if (typeof comp === 'object' && 'path' in comp) {
        return defineAsyncComponent(() => import(/* @vite-ignore */ comp.path))
    }

    // 如果是字符串且看起来像路径（包含 / 或 .vue），动态加载
    if (typeof comp === 'string' && (comp.includes('/') || comp.endsWith('.vue'))) {
        return defineAsyncComponent(() => import(/* @vite-ignore */ comp))
    }

    return undefined
})

/**
 * HTML 内容
 */
const htmlContent = computed<string | undefined>(() => {
    const comp = roomComponent.value

    if (!comp) {
        return undefined
    }

    // 如果是对象且有 html 属性
    if (typeof comp === 'object' && 'html' in comp) {
        return comp.html
    }

    // 如果是字符串且不是路径，当作 HTML
    if (typeof comp === 'string' && !comp.includes('/') && !comp.endsWith('.vue')) {
        return comp
    }

    return undefined
})
</script>

<style scoped lang='scss'>
.room-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.room-html-content {
    width: 100%;
    height: 100%;
}

.room-default {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;

    h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.2rem;
        color: #666;
    }
}
</style>
