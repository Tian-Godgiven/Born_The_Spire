import { CurrentMap } from "./currentMap"
import { Chara } from "@/core/objects/target/Target"
import { doEvent } from "@/core/objects/system/ActionEvent"

export const healthMap: CurrentMap<Chara> = {
    startValue: "max",
    maxBy: "max-health",  // 上限值
    minBy: 0,             // 下限值
    // 达到下限时触发 healthReachMin 事件
    // 具体的死亡逻辑由触发器系统处理
    reachMin: (event, owner) => {
        doEvent({
            key: "healthReachMin",
            source: event.source,
            medium: event.medium,
            target: owner,
            info: { reason: "生命值达到下限" },
            effectUnits: []
        })
    }
}