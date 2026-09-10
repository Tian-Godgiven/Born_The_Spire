/**
 * 房间组件注册表
 * 转发到核心 roomRegistry。进房组件挂在类型的 defaultComponent 上，不再维护第二张名单。
 * registerRoomComponent 只给已有类型换皮。
 */

import type { Component } from 'vue'
import type { RoomType } from '@/core/objects/room/Room'
import { roomRegistry } from '@/static/registry/roomRegistry'

/**
 * 给已登记的房间类型换皮
 */
export function registerRoomComponent(roomType: RoomType | string, component: Component): void {
    roomRegistry.setDefaultComponent(roomType, component)
}

/**
 * 按房间类型取进房 Vue 页
 */
export function getRoomComponent(roomType: RoomType | string): Component | null {
    return roomRegistry.getDefaultComponent(roomType) ?? null
}

/**
 * 检查该类型是否已挂进房组件
 */
export function hasRoomComponent(roomType: RoomType | string): boolean {
    return !!roomRegistry.getDefaultComponent(roomType)
}

/**
 * 已登记的房间类型
 */
export function getAllRegisteredRoomTypes(): (RoomType | string)[] {
    return roomRegistry.getRegisteredTypes()
}
