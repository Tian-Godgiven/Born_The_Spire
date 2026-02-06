/**
 * 宝箱房间
 *
 * @TODO 未实现 - 需要实现以下功能：
 * 1. 显示宝箱UI
 * 2. 打开宝箱获得遗物奖励
 * 3. 可能的宝箱类型：普通宝箱、稀有宝箱、Boss宝箱
 * 4. 动画效果
 *
 * 玩家进入后可以打开宝箱获得遗物奖励
 */

import { Room, RoomConfig } from "./Room"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 宝箱房间配置
 */
export interface TreasureRoomConfig extends RoomConfig {
    type: "treasure"
    chestType?: "normal" | "rare" | "boss"  // 宝箱类型（未来实现）
}

/**
 * 宝箱房间类
 */
export class TreasureRoom extends Room {
    public readonly chestType: string

    constructor(config: TreasureRoomConfig) {
        super(config)
        this.chestType = config.chestType || "normal"
    }

    /**
     * 进入宝箱房间
     */
    async enter(): Promise<void> {
        this.state = "active"
        newLog([`===== 宝箱房间 =====`])
        newLog([`⚠️ 此房间类型尚未实现，请等待后续更新`])
    }

    /**
     * 处理宝箱房间
     * @TODO 实现宝箱打开逻辑
     */
    async process(): Promise<void> {
        // 宝箱房间由 UI 驱动
        // 玩家点击宝箱打开

        // TODO: 实现以下功能
        // 1. 显示宝箱
        // 2. 点击打开
        // 3. 播放动画
        // 4. 获得遗物奖励
        // 5. 自动完成房间
    }

    /**
     * 完成宝箱房间
     */
    async complete(): Promise<void> {
        this.state = "completed"
        newLog([`宝箱已打开`])
    }

    /**
     * 离开宝箱房间
     */
    async exit(): Promise<void> {
        // 清理状态
    }

    getDisplayName(): string {
        return "宝箱房间"
    }

    getIcon(): string {
        return "📦"
    }
}

// ==================== 自动注册 ====================
// TODO: 注册宝箱房间到 roomRegistry
