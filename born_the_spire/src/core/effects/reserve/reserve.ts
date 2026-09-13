import { ActionEvent } from "@/core/objects/system/ActionEvent";
import { Effect } from "@/core/objects/system/effect/Effect";
import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc";
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier";
import { isEffect } from "@/core/utils/typeGuards";
import { newError } from "@/ui/hooks/global/alert";
import { newLog } from "@/ui/hooks/global/log";

/**
 * 获得储备效果
 *
 * params:
 * - reserveKey: 储备类型（如 "gold", "blood" 等）
 * - amount: 数量
 */
export function gainReserve(event: ActionEvent<any, any, any>, effect: Effect) {
    const { reserveKey, amount } = effect.params

    if (!reserveKey || amount === undefined) {
        console.error("[gainReserve] 缺少必要参数", effect.params)
        return
    }

    const reserveModifier = getReserveModifier(event.target)
    const reserveKeyStr = String(reserveKey)
    const amountNum = Number(amount)
    const current = reserveModifier.getReserve(reserveKeyStr)
    const newAmount = current + amountNum

    reserveModifier._setReserve(reserveKeyStr, newAmount)

    newLog([event.target, "获得了", amountNum, reserveKeyStr])
}

/**
 * 消耗储备效果
 *
 * params:
 * - reserveKey: 储备类型
 * - amount: 数量
 */
export function spendReserve(event: ActionEvent<any, any, any>, effect: Effect) {
    const { reserveKey, amount } = effect.params

    if (!reserveKey || amount === undefined) {
        console.error("[spendReserve] 缺少必要参数", effect.params)
        return
    }

    const reserveModifier = getReserveModifier(event.target)
    const reserveKeyStr = String(reserveKey)
    const amountNum = Number(amount)
    const current = reserveModifier.getReserve(reserveKeyStr)
    const newAmount = current - amountNum

    if (newAmount < 0) {
        console.warn(`[spendReserve] 储备 ${reserveKeyStr} 不足，需要 ${amountNum}，当前 ${current}`)
        // 设置为 0 而不是负数
        reserveModifier._setReserve(reserveKeyStr, 0)
    } else {
        reserveModifier._setReserve(reserveKeyStr, newAmount)
    }

    newLog([event.target, "消耗了", amountNum, reserveKeyStr])
}

/**
 * 按百分比修改 gainReserve / spendReserve 的 amount
 *
 * params:
 * - percent: number — 0.25 表示增加 25%，-0.25 表示减少 25%
 *
 * 用于 reaction：event.target 是储备 Effect，targetType: "triggerEffect"
 * 必须挂在 before，after 时 amount 已经结算
 */
export const modifyReserveByPercent: EffectFunc = (event, effect) => {
    const percent = Number(effect.params.percent)
    const target = event.target

    if (Array.isArray(target)) {
        newError(["modifyReserveByPercent 效果不支持多目标", target])
        return false
    }

    if (!isEffect(target)) {
        newError(["modifyReserveByPercent 的目标必须是 Effect 类型，当前类型:", target.participantType])
        return false
    }

    if (target.key !== "gainReserve" && target.key !== "spendReserve") {
        newError(["modifyReserveByPercent 只能作用于 gainReserve/spendReserve 效果，当前效果:", target.key])
        return false
    }

    const oldAmount = Number(target.params.amount)
    if (!Number.isFinite(percent) || !Number.isFinite(oldAmount)) {
        newError(["modifyReserveByPercent 需要有限的 percent 和 amount", effect.params, target.params])
        return false
    }

    const extra = Math.floor(oldAmount * percent)
    target.params.amount = Math.max(0, oldAmount + extra)
    return true
}
