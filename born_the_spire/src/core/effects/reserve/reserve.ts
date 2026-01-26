import { ActionEvent } from "@/core/objects/system/ActionEvent";
import { Effect } from "@/core/objects/system/effect/Effect";
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier";
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
