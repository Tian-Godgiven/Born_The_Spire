import { CurrentMap } from "@/core/types/CurrentMapData"
import type { Chara } from "@/core/objects/target/Target"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { newLog } from "@/ui/hooks/global/log"

/**
 * isAlive 当前值配置
 *
 * 用于标记角色是否存活
 * - 1 = 存活
 * - 0 = 死亡
 *
 * 通过 kill 事件改变为 0
 * 通过 revive 事件改变为 1
 */
export const isAliveMap: CurrentMap<Chara> = {
    startValue: 1,  // 初始为存活
    maxBy: 1,       // 上限为 1
    minBy: 0,       // 下限为 0
    allowOverMax: false,  // 不允许超过 1
    allowOverMin: false,  // 不允许低于 0

    // 达到下限（死亡）时的回调
    reachMin: (event, owner) => {
        newLog(["角色死亡", owner.label])

        // 触发 death 事件（死亡后事件，用于死亡后的处理）
        doEvent({
            key: "death",
            source: event.source,
            medium: event.medium,
            target: owner,
            info: { reason: event.info?.reason || "未知原因" },
            effectUnits: []
        })
    },

    // 达到上限（复活）时的回调
    reachMax: (event, owner) => {
        newLog(["角色复活", owner.label])

        // 触发 revived 事件（复活后事件）
        doEvent({
            key: "revived",
            source: event.source,
            medium: event.medium,
            target: owner,
            effectUnits: []
        })
    }
}
