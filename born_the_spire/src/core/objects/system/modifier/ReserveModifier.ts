import { reactive } from "vue"
import { Entity } from "../Entity"
import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "../ActionEvent"

/**
 * 储备管理器
 *
 * 管理角色的各种储备（金钱、血液、灵魂等）
 * 所有储备都是一过性的，不追踪来源
 * 每个实体可以有一个 ReserveModifier 实例
 */
export class ReserveModifier {
    private readonly owner: Entity
    // 储备映射：reserveKey -> 数量
    private reserves: Map<string, number> = reactive(new Map())

    constructor(owner: Entity) {
        this.owner = owner
        // 预定义金钱
        this.reserves.set("gold", 0)
    }

    /**
     * 获取储备数量
     * @param reserveKey 储备类型（如 "gold", "blood" 等）
     * @returns 当前数量，如果不存在则返回 0
     */
    getReserve(reserveKey: string): number {
        return this.reserves.get(reserveKey) ?? 0
    }

    /**
     * 获取所有储备（响应式）
     */
    getAllReserves(): Map<string, number> {
        return this.reserves
    }

    /**
     * 增加储备（触发事件，可被遗物拦截修改）
     * @param reserveKey 储备类型
     * @param amount 数量
     * @param source 来源实体（可选）
     * @returns 实际增加的数量（可能被遗物修改）
     */
    gainReserve(reserveKey: string, amount: number, source?: Entity): number {
        // 触发 gainReserve 事件
        doEvent({
            key: "gainReserve",
            source: source || this.owner,
            medium: this.owner,
            target: this.owner,
            effectUnits: [{
                key: "gainReserve",
                params: { reserveKey, amount }
            }]
        })

        // 返回实际增加的数量（可能在事件中被修改）
        return amount
    }

    /**
     * 消耗储备（触发事件）
     * @param reserveKey 储备类型
     * @param amount 数量
     * @returns 是否成功消耗（true 表示成功，false 表示储备不足）
     */
    spendReserve(reserveKey: string, amount: number): boolean {
        const current = this.getReserve(reserveKey)
        if (current < amount) {
            newLog([this.owner, `储备 ${reserveKey} 不足，需要 ${amount}，当前 ${current}`])
            return false
        }

        // 触发 spendReserve 事件
        doEvent({
            key: "spendReserve",
            source: this.owner,
            medium: this.owner,
            target: this.owner,
            effectUnits: [{
                key: "spendReserve",
                params: { reserveKey, amount }
            }]
        })

        return true
    }

    /**
     * 检查是否有足够储备
     * @param reserveKey 储备类型
     * @param amount 数量
     * @returns 是否足够
     */
    hasReserve(reserveKey: string, amount: number): boolean {
        return this.getReserve(reserveKey) >= amount
    }

    /**
     * 直接设置储备（内部方法，由 effect 调用）
     * @param reserveKey 储备类型
     * @param amount 数量
     */
    _setReserve(reserveKey: string, amount: number) {
        this.reserves.set(reserveKey, Math.max(0, amount))  // 储备不能为负
    }

    /**
     * 初始化新的储备类型（用于 mod 添加新货币）
     * @param reserveKey 储备类型
     * @param initialAmount 初始数量，默认 0
     */
    initReserve(reserveKey: string, initialAmount: number = 0) {
        if (!this.reserves.has(reserveKey)) {
            this.reserves.set(reserveKey, initialAmount)
        }
    }

    /**
     * 获取统计信息（用于调试）
     */
    getStats() {
        const stats: Record<string, number> = {}
        for (const [key, value] of this.reserves.entries()) {
            stats[key] = value
        }
        return stats
    }
}

/**
 * 为实体初始化储备管理器
 */
export function initReserveModifier(entity: Entity): ReserveModifier {
    const modifier = new ReserveModifier(entity)
    Object.defineProperty(entity, '_reserveModifier', {
        value: modifier,
        writable: false,
        enumerable: false,
        configurable: false
    })
    return modifier
}

/**
 * 获取实体的储备管理器
 */
export function getReserveModifier(entity: Entity): ReserveModifier {
    const modifier = (entity as any)._reserveModifier
    if (!modifier) {
        return initReserveModifier(entity)
    }
    return modifier
}
