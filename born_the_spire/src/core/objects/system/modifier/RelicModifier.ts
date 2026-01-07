import { Entity } from "../Entity"
import { Relic } from "../../item/Subclass/Relic"
import { ItemModifier } from "./ItemModifier"
import { newLog, LogUnit } from "@/ui/hooks/global/log"
import { computed } from "vue"

/**
 * 遗物管理器
 *
 * 专门用于管理角色的遗物及其产生的副作用（触发器、修饰器等）
 * 每个角色应该有一个 RelicModifier 实例
 *
 * 遗物相对器官来说更简单，主要依赖基类的通用交互处理逻辑
 */
export class RelicModifier extends ItemModifier {
    public relics = computed(() => this.units.map(u => u.item as Relic))

    constructor(owner: Entity) {
        super(owner)
    }

    /**
     * 获得遗物
     *
     * 完整流程（使用基类的通用方法）：
     * 1. 调用基类 acquireItem 处理 possess 和 get 交互
     * 2. 遗物没有额外的特殊逻辑（不像器官有卡牌系统）
     */
    acquireRelic(relic: Relic, source: Entity, parentLog?: LogUnit) {
        const log = parentLog || newLog([this.owner, "获得了遗物", relic])

        // 使用基类的通用方法处理获得逻辑
        this.acquireItem(relic, source, log)
    }

    /**
     * 失去遗物
     *
     * 完整流程：
     * 1. 调用基类 loseItem 清理所有副作用
     * 2. 可选：触发 lose 交互
     */
    loseRelic(relic: Relic, triggerLoseEffect: boolean = false, parentLog?: LogUnit) {
        const log = parentLog || newLog([this.owner, "失去了遗物", relic])

        // 使用基类的通用方法处理失去逻辑
        this.loseItem(relic, triggerLoseEffect, log)
    }

    /**
     * 移除遗物（通过遗物对象）
     * @alias loseRelic
     */
    removeRelic(relic: Relic, triggerLoseEffect: boolean = false, parentLog?: LogUnit): boolean {
        this.loseRelic(relic, triggerLoseEffect, parentLog)
        return true
    }

    /**
     * 移除遗物（通过遗物 key）
     */
    removeRelicByKey(relicKey: string, triggerLoseEffect: boolean = false, parentLog?: LogUnit): boolean {
        const relic = this.getRelicByKey(relicKey)
        if (relic) {
            this.loseRelic(relic, triggerLoseEffect, parentLog)
            return true
        }
        return false
    }

    /**
     * 获取所有遗物（响应式）
     */
    getRelics(): Relic[] {
        return this.relics.value
    }

    /**
     * 获取指定 key 的遗物
     */
    getRelicByKey(relicKey: string): Relic | undefined {
        const unit = this.units.find(u => (u.item as any).key === relicKey)
        return unit?.item as Relic | undefined
    }

    /**
     * 检查是否拥有指定遗物
     */
    hasRelic(relicKey: string): boolean {
        return this.units.some(u => (u.item as any).key === relicKey)
    }

    /**
     * 使用遗物（主动效果）
     * @param relic 要使用的遗物
     * @param targets 目标实体数组
     * @returns "cant" 表示无法使用，"success" 表示成功
     */
    useRelic(relic: Relic, targets: Entity[]) {
        // 直接使用基类的通用方法
        return this.useItem(relic, targets)
    }

    /**
     * 使遗物失效
     * @param relic 要失效的遗物
     */
    disableRelic(relic: Relic) {
        // 直接使用基类的通用方法
        return this.disableItem(relic)
    }

    /**
     * 使遗物恢复
     * @param relic 要恢复的遗物
     */
    enableRelic(relic: Relic) {
        // 直接使用基类的通用方法
        return this.enableItem(relic)
    }
}

/**
 * 为实体初始化遗物管理器
 */
export function initRelicModifier(entity: Entity): RelicModifier {
    const modifier = new RelicModifier(entity)
    Object.defineProperty(entity, '_relicModifier', {
        value: modifier,
        writable: false,
        enumerable: false,
        configurable: false
    })
    return modifier
}

/**
 * 获取实体的遗物管理器
 */
export function getRelicModifier(entity: Entity): RelicModifier {
    const modifier = (entity as any)._relicModifier
    if (!modifier) {
        return initRelicModifier(entity)
    }
    return modifier
}
