import { showQuickInfo } from "@/ui/hooks/global/quickInfo"
import { Player } from "../objects/target/Player"
import type { EffectFunc } from "../objects/system/effect/EffectFunc"
import type { Entity } from "../objects/system/Entity"
import { getStatusValue } from "../objects/system/status/Status"
import { changeCurrentValue, getCurrentValue, ifHaveCurrent } from "../objects/system/Current/current"
import { doEvent, handleEventEntity } from "../objects/system/ActionEvent"
import { isEntity } from "../utils/typeGuards"

/** 没有 energy 当前值时跳过（器官等） */
function withEnergy(e: unknown, fn: (entity: Entity) => void) {
    if (!isEntity(e) || Array.isArray(e) || !ifHaveCurrent(e, "energy")) return
    fn(e)
}

// 原子：获得 N 能量（受 max-energy 上限截断）
export const gainEnergy: EffectFunc = (event, effect) => {
    const { target } = event
    const value = Number(effect.params.value ?? 0)
    handleEventEntity(target, (e) => {
        withEnergy(e, (entity) => {
            const nowValue = getCurrentValue(entity, "energy", 0)
            changeCurrentValue(entity, "energy", nowValue + value, event)
        })
    })
}

// 原子：失去 N 能量（最低到 0）
export const loseEnergy: EffectFunc = (event, effect) => {
    const { target } = event
    const value = Number(effect.params.value ?? 0)
    handleEventEntity(target, (e) => {
        withEnergy(e, (entity) => {
            const nowValue = getCurrentValue(entity, "energy", 0)
            changeCurrentValue(entity, "energy", nowValue - value, event)
        })
    })
}

// 原子：能量回满
export const refillEnergy: EffectFunc = (event, _effect) => {
    const { target } = event
    handleEventEntity(target, (e) => {
        withEnergy(e, (entity) => {
            const max = Number(getStatusValue(entity, "max-energy", 0))
            changeCurrentValue(entity, "energy", max, event)
        })
    })
}

// 原子：能量归零
export const emptyEnergy: EffectFunc = (event, _effect) => {
    const { target } = event
    handleEventEntity(target, (e) => {
        withEnergy(e, (entity) => {
            changeCurrentValue(entity, "energy", 0, event)
        })
    })
}

// 复合：支付 N 能量（打牌 / 主动能力用作费用门槛）
// 不够 → return false 供上层拦截
// 够 → 委派 loseEnergy 事件完成扣减，广播的仍是 loseEnergy（触发器统一入口）
export const payEnergy: EffectFunc<boolean> = (event, effect) => {
    const { source } = event
    if (!isEntity(source) || Array.isArray(source) || !ifHaveCurrent(source, "energy")) return false
    const cost = Number(effect.params.value ?? 0)
    if (getCurrentValue(source, "energy", 0) < cost) {
        if (source instanceof Player) showQuickInfo("能量不足")
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
