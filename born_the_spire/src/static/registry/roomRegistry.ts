/**
 * 房间注册表系统
 * 支持 mod 制作者注册自定义房间类型和组件
 */

import { Room, RoomType } from "@/core/objects/room/Room"
import { Component } from "vue"

/**
 * 房间组件类型
 * 支持多种形式的组件定义
 */
export type RoomComponent =
    | Component                    // Vue 组件实例
    | string                       // HTML 字符串或组件路径
    | { html: string }             // 明确指定为 HTML
    | { path: string }             // 明确指定为组件路径

/**
 * 房间配置映射
 * 定义房间的数据配置
 */
export interface RoomMap {
    key: string                    // 房间唯一标识
    type: RoomType | string        // 房间类型
    name?: string                  // 房间名称
    description?: string           // 房间描述
    component?: RoomComponent      // 房间组件（支持 Vue 组件、HTML、路径）
    customData?: Record<string, any> // 自定义数据（供 mod 使用）
}

/**
 * 房间类构造函数类型
 */
export type RoomConstructor = new (config: any) => Room

/**
 * 房间类型注册信息
 */
interface RoomTypeRegistration {
    roomClass: RoomConstructor     // 房间类
    defaultComponent?: Component   // 默认组件
}

/**
 * 房间注册表类
 * 管理所有房间类型和配置
 */
class RoomRegistry {
    // 房间类型映射表（type -> RoomClass）
    private roomTypes: Map<string, RoomTypeRegistration> = new Map()

    // 房间配置列表
    private roomConfigs: Map<string, RoomMap> = new Map()

    /**
     * 注册房间类型
     * @param type 房间类型标识
     * @param roomClass 房间类
     * @param defaultComponent 默认 Vue 组件（可选）
     */
    registerRoomType(
        type: string,
        roomClass: RoomConstructor,
        defaultComponent?: Component
    ): void {
        if (this.roomTypes.has(type)) {
            console.warn(`[RoomRegistry] 房间类型 "${type}" 已存在，将被覆盖`)
        }

        this.roomTypes.set(type, {
            roomClass,
            defaultComponent
        })

        console.log(`[RoomRegistry] 注册房间类型: ${type}`)
    }

    /**
     * 注册房间配置
     * @param config 房间配置
     */
    registerRoomConfig(config: RoomMap): void {
        if (this.roomConfigs.has(config.key)) {
            console.warn(`[RoomRegistry] 房间配置 "${config.key}" 已存在，将被覆盖`)
        }

        this.roomConfigs.set(config.key, config)
        console.log(`[RoomRegistry] 注册房间配置: ${config.key}`)
    }

    /**
     * 批量注册房间配置
     * @param configs 房间配置数组
     */
    registerRoomConfigs(configs: RoomMap[]): void {
        configs.forEach(config => this.registerRoomConfig(config))
    }

    /**
     * 获取房间类型注册信息
     * @param type 房间类型
     */
    getRoomType(type: string): RoomTypeRegistration | undefined {
        return this.roomTypes.get(type)
    }

    /**
     * 获取房间配置
     * @param key 房间 key
     */
    getRoomConfig(key: string): RoomMap | undefined {
        return this.roomConfigs.get(key)
    }

    /**
     * 获取所有房间配置
     */
    getAllRoomConfigs(): RoomMap[] {
        return Array.from(this.roomConfigs.values())
    }

    /**
     * 根据类型获取房间配置列表
     * @param type 房间类型
     */
    getRoomConfigsByType(type: RoomType | string): RoomMap[] {
        return this.getAllRoomConfigs().filter(config => config.type === type)
    }

    /**
     * 创建房间实例
     * @param key 房间配置 key
     * @param layer 层级
     * @param additionalConfig 额外配置
     */
    createRoom(
        key: string,
        layer: number,
        additionalConfig?: Record<string, any>
    ): Room | null {
        const config = this.getRoomConfig(key)
        if (!config) {
            console.error(`[RoomRegistry] 未找到房间配置: ${key}`)
            return null
        }

        const typeRegistration = this.getRoomType(config.type)
        if (!typeRegistration) {
            console.error(`[RoomRegistry] 未注册房间类型: ${config.type}`)
            return null
        }

        // 合并配置
        const fullConfig = {
            ...config,
            layer,
            ...additionalConfig
        }

        // 创建房间实例
        try {
            const room = new typeRegistration.roomClass(fullConfig)
            console.log(`[RoomRegistry] 创建房间实例: ${key} (${config.type})`)
            return room
        } catch (error) {
            console.error(`[RoomRegistry] 创建房间实例失败: ${key}`, error)
            return null
        }
    }

    /**
     * 获取房间组件
     * @param room 房间实例或房间 key
     */
    getRoomComponent(room: Room | string): Component | undefined {
        let config: RoomMap | undefined

        if (typeof room === 'string') {
            config = this.getRoomConfig(room)
        } else {
            config = this.getRoomConfig(room.__key)
        }

        if (!config) {
            return undefined
        }

        // 优先使用配置中的组件
        if (config.component) {
            return typeof config.component === 'string'
                ? undefined  // 字符串路径需要动态加载
                : config.component as Component
        }

        // 使用类型默认组件
        const typeRegistration = this.getRoomType(config.type)
        return typeRegistration?.defaultComponent
    }

    /**
     * 清空注册表（用于测试）
     */
    clear(): void {
        this.roomTypes.clear()
        this.roomConfigs.clear()
    }
}

// 导出单例
export const roomRegistry = new RoomRegistry()

// 导出类型供外部使用
export type { RoomTypeRegistration }

/**
 * 初始化所有房间类型
 * 在懒加载完成后调用，依次调用各个房间类型的注册模块
 */
export async function initAllRooms(): Promise<void> {
    console.log('[RoomRegistry] 开始注册所有房间类型...')

    // 导入各个房间类型的注册模块
    const { initBattleRooms } = await import('./rooms/initBattleRooms')
    const { initEventRooms } = await import('./rooms/initEventRooms')
    const { initPoolRooms } = await import('./rooms/initPoolRooms')
    const { initBlackStoreRooms } = await import('./rooms/initBlackStoreRooms')
    const { initRoomSelectRooms } = await import('./rooms/initRoomSelectRooms')

    // 依次初始化各个房间类型
    await initBattleRooms()
    await initEventRooms()
    await initPoolRooms()
    await initBlackStoreRooms()
    await initRoomSelectRooms()

    console.log('[RoomRegistry] 所有房间类型和配置注册完成')
}

