/**
 * 房间组件注册表
 * 用于注册房间类型对应的 Vue 组件，支持 Mod 扩展
 */

import { Component } from 'vue'
import type { RoomType } from '@/core/objects/room/Room'

// 导入内置房间组件
import Battle from '@/ui/page/Scene/running/Battle.vue'
import InitRoom from '@/ui/page/Scene/running/InitRoom.vue'
import EventRoom from '@/ui/page/Scene/running/EventRoom.vue'
import PoolRoom from '@/ui/page/Scene/running/PoolRoom.vue'
// import BlackStoreRoom from '@/ui/page/Scene/running/BlackStoreRoom.vue'
import RoomSelectRoom from '@/ui/page/Scene/running/RoomSelectRoom.vue'

/**
 * 房间组件映射表
 */
const roomComponentMap = new Map<RoomType | string, Component>()

/**
 * 初始化内置房间组件
 */
function initBuiltInRoomComponents() {
    roomComponentMap.set('init', InitRoom)
    roomComponentMap.set('battle', Battle)
    roomComponentMap.set('eliteBattle', Battle)  // 精英战斗使用相同的战斗组件
    roomComponentMap.set('bossBattle', Battle)   // Boss战斗使用相同的战斗组件
    roomComponentMap.set('event', EventRoom)
    roomComponentMap.set('pool', PoolRoom)
    // roomComponentMap.set('blackStore', BlackStoreRoom)
    roomComponentMap.set('roomSelect', RoomSelectRoom)
}

// 自动初始化
initBuiltInRoomComponents()

/**
 * 注册房间组件
 * @param roomType 房间类型
 * @param component Vue 组件
 */
export function registerRoomComponent(roomType: RoomType | string, component: Component): void {
    if (roomComponentMap.has(roomType)) {
        console.warn(`[RoomComponentRegistry] 房间类型 "${roomType}" 的组件已存在，将被覆盖`)
    }
    roomComponentMap.set(roomType, component)
}

/**
 * 获取房间组件
 * @param roomType 房间类型
 * @returns Vue 组件，如果未找到则返回 null
 */
export function getRoomComponent(roomType: RoomType | string): Component | null {
    return roomComponentMap.get(roomType) || null
}

/**
 * 检查房间组件是否已注册
 * @param roomType 房间类型
 */
export function hasRoomComponent(roomType: RoomType | string): boolean {
    return roomComponentMap.has(roomType)
}

/**
 * 获取所有已注册的房间类型
 */
export function getAllRegisteredRoomTypes(): (RoomType | string)[] {
    return Array.from(roomComponentMap.keys())
}
