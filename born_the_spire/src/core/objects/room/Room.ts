import { nanoid } from "nanoid"
import { reactive } from "vue"

/**
 * 房间类型
 */
export type RoomType = "battle" | "event" | "pool" | "blackStore" | "roomSelect"

/**
 * 房间状态
 */
export type RoomState = "pending" | "active" | "completed"

/**
 * 战斗房间子类型
 */
export type BattleRoomType = "normal" | "elite" | "boss"

/**
 * 房间配置接口
 */
export interface RoomConfig {
    key?: string              // 房间唯一标识（可选，自动生成）
    type: RoomType           // 房间类型
    layer: number            // 所在层级
    name?: string            // 房间名称（可选）
    description?: string     // 房间描述（可选）
}

/**
 * 房间基类
 * 所有房间类型的抽象基类，定义房间的通用属性和生命周期方法
 */
export abstract class Room {
    public readonly __key: string       // 房间唯一标识
    public readonly type: RoomType      // 房间类型
    public readonly layer: number       // 所在层级
    public readonly name?: string       // 房间名称
    public readonly description?: string // 房间描述
    public state: RoomState             // 房间状态

    constructor(config: RoomConfig) {
        this.__key = config.key || nanoid()
        this.type = config.type
        this.layer = config.layer
        this.name = config.name
        this.description = config.description
        this.state = "pending"

        // 使用 Vue 响应式包装（如果需要在 UI 中显示状态）
        return reactive(this) as this
    }

    /**
     * 进入房间时触发
     * 用于初始化房间内容、显示 UI 等
     */
    abstract enter(): void | Promise<void>

    /**
     * 处理房间内容
     * 不同房间类型的核心逻辑
     */
    abstract process(): void | Promise<void>

    /**
     * 完成房间时触发
     * 用于结算奖励、清理状态等
     */
    abstract complete(): void | Promise<void>

    /**
     * 离开房间时触发
     * 用于清理资源、保存状态等
     */
    abstract exit(): void | Promise<void>

    /**
     * 判断房间是否已完成
     */
    isCompleted(): boolean {
        return this.state === "completed"
    }

    /**
     * 判断房间是否正在进行中
     */
    isActive(): boolean {
        return this.state === "active"
    }

    /**
     * 获取房间显示名称
     */
    getDisplayName(): string {
        if (this.name) {
            return this.name
        }

        // 默认根据类型返回名称
        const typeNameMap: Record<RoomType, string> = {
            "battle": "战斗",
            "event": "事件",
            "pool": "水池",
            "blackStore": "黑市",
            "roomSelect": "选择房间"
        }

        return typeNameMap[this.type] || "未知房间"
    }

    /**
     * 获取房间的图标或标识符（用于 UI 显示）
     */
    getIcon(): string {
        const iconMap: Record<RoomType, string> = {
            "battle": "⚔️",
            "event": "?",
            "pool": "〜",
            "blackStore": "$",
            "roomSelect": "→"
        }

        return iconMap[this.type] || "?"
    }
}
