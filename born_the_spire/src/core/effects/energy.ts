import { showQuickInfo } from "@/ui/hooks/global/quickInfo"
import { Player } from "../objects/target/Player"
import type { EffectFunc } from "../objects/system/effect/EffectFunc"
import { getStatusValue } from "../objects/system/status/Status"
import { changeCurrentValue, getCurrentValue } from "../objects/system/Current/current"
import { doEvent, handleEventEntity } from "../objects/system/ActionEvent"
import { isEntity } from "../utils/typeGuards"

// 原子：获得 N 能量（受 max-energy 上限截断）
export const gainEnergy: EffectFunc = (event, effect) => {
    const { target } = event
    const value = Number(effect.params.value ?? 0)
    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const nowValue = getCurrentValue(e, "energy")
        changeCurrentValue(e, "energy", nowValue + value, event)
    })
}

// 原子：失去 N 能量（最低到 0）
export const loseEnergy: EffectFunc = (event, effect) => {
    const { target } = event
    const value = Number(effect.params.value ?? 0)
    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const nowValue = getCurrentValue(e, "energy")
        changeCurrentValue(e, "energy", nowValue - value, event)
    })
}

// 原子：能量回满
export const refillEnergy: EffectFunc = (event, _effect) => {
    const { target } = event
    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        const max = Number(getStatusValue(e, "max-energy", 0))
        changeCurrentValue(e, "energy", max, event)
    })
}

// 原子：能量归零
export const emptyEnergy: EffectFunc = (event, _effect) => {
    const { target } = event
    handleEventEntity(target, (e) => {
        if (!isEntity(e)) return
        changeCurrentValue(e, "energy", 0, event)
    })
}

// 复合：支付 N 能量（打牌 / 主动能力用作费用门槛）
// 不够 → return false 供上层拦截
// 够 → 委派 loseEnergy 事件完成扣减，广播的仍是 loseEnergy（触发器统一入口）
export const payEnergy: EffectFunc<boolean> = (event, effect) => {
    const { source } = event
    if (!(source instanceof Player)) return false
    const cost = Number(effect.params.value ?? 0)
    if (getCurrentValue(source, "energy") < cost) {
        showQuickInfo("能量不足")
        return false
    }
    doEvent({
        key: "loseEnergy",
        source,
        medium: source,
        target: source,
        effectUnits: [{ key: "loseEnergy", params: { value: cost } }]
    })
    return true
}
