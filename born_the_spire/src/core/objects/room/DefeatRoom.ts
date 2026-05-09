/**
 * 失败房间
 * 玩家死亡后进入的特殊房间，展示本局统计信息
 * Mod 作者可以通过 roomComponentRegistry 注册自定义的失败页面组件
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 失败房间配置
 */
export interface DefeatRoomConfig extends Omit<RoomConfig, 'type'> {
    defeatedBy?: string         // 击败玩家的来源
}

export class DefeatRoom extends Room {

    public defeatedBy?: string

    constructor(config: DefeatRoomConfig) {
        super({
            ...config,
            type: "defeat",
            name: config.name ?? "游戏结束"
        })
        this.defeatedBy = config.defeatedBy
    }

    async enter(): Promise<void> {
        newLog(["===== 游戏结束 ====="])
    }

    async process(): Promise<void> {
        // UI 驱动，等待玩家选择重试或返回主菜单
    }

    async complete(): Promise<void> {}

    async exit(): Promise<void> {}
}
