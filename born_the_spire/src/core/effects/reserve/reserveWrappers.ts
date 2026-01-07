import { Entity } from "@/core/objects/system/Entity"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"

/**
 * 储备包装函数
 *
 * 提供便捷的储备操作函数
 */

/**
 * 获得金钱
 */
export function gainGold(entity: Entity, amount: number, source?: Entity) {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.gainReserve("gold", amount, source)
}

/**
 * 消耗金钱
 */
export function spendGold(entity: Entity, amount: number): boolean {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.spendReserve("gold", amount)
}

/**
 * 检查是否有足够金钱
 */
export function hasGold(entity: Entity, amount: number): boolean {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.hasReserve("gold", amount)
}

/**
 * 获取金钱数量
 */
export function getGold(entity: Entity): number {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.getReserve("gold")
}

/**
 * 设置金钱数量（仅用于特殊情况）
 */
export function setGold(entity: Entity, amount: number) {
    const reserveModifier = getReserveModifier(entity)
    reserveModifier._setReserve("gold", amount)
}

/**
 * 通用：获得储备
 */
export function gainReserveWrapper(entity: Entity, reserveKey: string, amount: number, source?: Entity) {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.gainReserve(reserveKey, amount, source)
}

/**
 * 通用：消耗储备
 */
export function spendReserveWrapper(entity: Entity, reserveKey: string, amount: number): boolean {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.spendReserve(reserveKey, amount)
}

/**
 * 通用：检查储备是否足够
 */
export function hasReserveWrapper(entity: Entity, reserveKey: string, amount: number): boolean {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.hasReserve(reserveKey, amount)
}

/**
 * 通用：获取储备数量
 */
export function getReserveWrapper(entity: Entity, reserveKey: string): number {
    const reserveModifier = getReserveModifier(entity)
    return reserveModifier.getReserve(reserveKey)
}
