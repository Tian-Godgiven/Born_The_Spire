/**
 * 通关房间
 * 玩家通关后进入的特殊房间，展示本局统计信息
 * Mod 作者可以通过 roomComponentRegistry 注册自定义的通关页面组件
 */

import { Room } from "./Room"
import type { RoomConfig } from "./Room"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 通关房间配置
 */
export interface VictoryRoomConfig extends Omit<RoomConfig, 'type'> {
}

export class VictoryRoom extends Room {

    constructor(config: VictoryRoomConfig) {
        super({
            ...config,
            type: "victory",
            name: config.name ?? "通关"
        })
    }

    async enter(): Promise<void> {
        newLog(["===== 通关！ ====="])
    }

    async process(): Promise<void> {
        // UI 驱动，等待玩家选择
    }

    async complete(): Promise<void> {}

    async exit(): Promise<void> {}
}
