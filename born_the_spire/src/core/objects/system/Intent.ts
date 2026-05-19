import { Card } from "@/core/objects/item/Subclass/Card"
import { simulateEffect } from "./SimulateEvent"
import { Entity } from "./Entity"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { nanoid } from "nanoid"

/**
 * 意图模拟用的虚拟目标
 *
 * 不带任何触发器，避免模拟时触发 target 端的机制（如护甲吸收伤害）
 * 意图只需要计算 source 端的 buff 影响（力量、虚弱等）
 */
const intentDummyTarget: EventParticipant = {
    __id: nanoid(),
    participantType: "dummy" as any,
    label: "_intentDummy"
}

/**
 * 意图类型
 *
 * 敌人行动的意图分类，用于向玩家展示敌人下回合的行动
 */
export type IntentType = "attack" | "defend" | "buff" | "debuff" | "heal" | "escape" | "unknown" | "special"

/**
 * 意图可见性等级
 *
 * 控制玩家能看到多少意图信息（可通过眼球器官等提升）
 */
export type IntentVisibility =
    | "hidden"      // 完全不可见
    | "type"        // 只能看到类型（攻击/防御/增益等）
    | "range"       // 能看到大致范围（低/中/高）
    | "exact"       // 能看到精确数值
    | "card"        // 能看到具体卡牌名称

/**
 * 意图对象
 *
 * 表示敌人的行动意图，包含类型、数值和实际要执行的卡牌
 */
export type Intent = {
    type: IntentType            // 意图类型
    value?: number              // 显示的数值（伤害/格挡等）
    count?: number              // 攻击次数（多段攻击时显示）
    actions: Card[]             // 实际要执行的卡牌列表
    visibility?: IntentVisibility  // 可见性等级（默认为 exact）
}

/**
 * 意图类型信息
 */
export type IntentTypeInfo = {
    label: string               // 显示名称
    describe: string            // 描述
    icon?: string               // 图标（可选）
    color?: string              // 颜色（可选）
}

/**
 * 意图类型注册表
 *
 * 定义所有意图类型的显示信息，支持Mod扩展
 */
export const intentTypeMap: Record<IntentType, IntentTypeInfo> = {
    attack: {
        label: "攻击",
        describe: "敌人将造成伤害",
        color: "#ff4444"
    },
    defend: {
        label: "防御",
        describe: "敌人将获得格挡",
        color: "#44ff44"
    },
    buff: {
        label: "增益",
        describe: "敌人将获得增益效果",
        color: "#4444ff"
    },
    debuff: {
        label: "减益",
        describe: "敌人将施加减益效果",
        color: "#ff44ff"
    },
    heal: {
        label: "治疗",
        describe: "敌人将回复生命",
        color: "#44cc44"
    },
    escape: {
        label: "逃跑",
        describe: "敌人将试图逃跑",
        color: "#cccccc"
    },
    unknown: {
        label: "未知",
        describe: "无法预测敌人的行动",
        color: "#888888"
    },
    special: {
        label: "特殊",
        describe: "敌人将执行特殊行动",
        color: "#ffaa00"
    }
}

/**
 * 注册自定义意图类型（供Mod使用）
 */
export function registerIntentType(type: string, info: IntentTypeInfo) {
    if (intentTypeMap[type as IntentType]) {
        console.warn(`[Intent] 意图类型 ${type} 已存在，将被覆盖`)
    }
    (intentTypeMap as any)[type] = info
}

/**
 * 获取意图类型信息
 */
export function getIntentTypeInfo(type: IntentType): IntentTypeInfo | undefined {
    return intentTypeMap[type]
}

/**
 * 意图数值来源映射
 *
 * 定义每种意图类型从哪些 effectMap key 中读取数值
 * 可通过 registerIntentValueSource 扩展（供 Mod 使用）
 */
const intentValueSources: Partial<Record<IntentType, string[]>> = {
    attack: ["damage"],
    defend: ["gainArmor"],
    heal: ["heal"]
}

/**
 * 注册意图数值来源（供 Mod 使用）
 *
 * @param intentType 意图类型
 * @param effectKeys 对应的 effectMap key 列表
 */
export function registerIntentValueSource(intentType: IntentType, effectKeys: string[]) {
    intentValueSources[intentType] = effectKeys
}

/**
 * 从卡牌 tag 推导意图类型（兜底逻辑）
 *
 * 当 BehaviorPattern 没有声明 intent 时使用
 */
function inferIntentFromTags(card: Card): IntentType {
    if (card.tags?.includes("attack")) return "attack"
    if (card.tags?.includes("defence")) return "defend"
    if (card.tags?.includes("skill")) return "defend"
    if (card.tags?.includes("power")) return "buff"
    if (card.tags?.includes("curse")) return "debuff"
    return "special"
}

/**
 * 从卡牌列表分析生成意图
 *
 * 意图类型优先使用 BehaviorPattern 声明的 intentType，
 * 未声明时从卡牌 tag 推导。
 * 意图数值从卡牌效果的 params.value 读取，通过事件模拟系统计算 Buff 影响。
 *
 * @param cards 要执行的卡牌列表
 * @param owner 卡牌持有者（用于计算 Buff 影响）
 * @param visibility 可见性等级
 * @param intentType 由 BehaviorPattern 声明的意图类型（可选）
 * @returns 意图对象
 */
export async function cardsToIntent(
    cards: Card[],
    owner: Entity,
    visibility: IntentVisibility = "card",
    intentType?: IntentType,
    target?: Entity
): Promise<Intent> {
    if (cards.length === 0) {
        return { type: "unknown", actions: [], visibility }
    }

    // 1. 确定意图类型：优先用声明的，否则从卡牌 tag 推导
    const type = intentType ?? inferIntentFromTags(cards[0])

    // 2. 计算意图数值
    const effectKeys = intentValueSources[type]
    let intentValue: number | undefined = undefined
    let intentCount: number | undefined = undefined

    if (effectKeys && effectKeys.length > 0) {
        let totalValue = 0
        let hitCount = 0

        for (const card of cards) {
            const useInteraction = card.getInteraction("use")
            if (!useInteraction || !useInteraction.effects) continue

            for (const effect of useInteraction.effects) {
                if (effectKeys.includes(effect.key) && effect.params?.value != null) {
                    const baseValue = Number(effect.params.value)
                    // 模拟 Buff 影响（力量、虚弱、易伤等）
                    // 有 target 时用真实目标（触发易伤/减伤），无 target 时用虚拟实体
                    // 护甲等机制在模拟模式下自动跳过（检查 event.simulate）
                    const simulated = await simulateEffect(
                        { key: effect.key, params: { value: baseValue } },
                        owner, owner, target ?? intentDummyTarget
                    )
                    totalValue += Number(simulated.params.value)
                    hitCount++
                }
            }
        }

        if (hitCount > 0) {
            intentValue = totalValue
            if (hitCount > 1) {
                intentCount = hitCount
            }
        }
    }

    return {
        type,
        value: intentValue,
        count: intentCount,
        actions: cards,
        visibility
    }
}

/**
 * 根据可见性等级格式化意图显示
 *
 * @param intent 意图对象
 * @returns 格式化后的显示文本
 */
export function formatIntentDisplay(intent: Intent): string {
    const typeInfo = getIntentTypeInfo(intent.type)
    const typeName = typeInfo?.label || "未知"

    switch (intent.visibility) {
        case "hidden":
            return "?"

        case "type":
            return typeName

        case "range":
            if (intent.value !== undefined) {
                const range = getValueRange(intent.value)
                return `${typeName}(${range})`
            }
            return typeName

        case "exact":
        default:
            if (intent.value !== undefined) {
                const countText = intent.count ? ` x${intent.count}` : ""
                return `${typeName}: ${intent.value}${countText}`
            }
            return typeName

        case "card":
            // 显示所有执行的卡牌名称
            if (intent.actions.length > 0) {
                const cardNames = intent.actions.map(card => card.label).join(" + ")
                const countText = intent.count ? ` x${intent.count}` : ""
                return `${typeName}: ${cardNames}${countText}`
            }
            return typeName
    }
}

/**
 * 将数值转换为范围描述
 */
function getValueRange(value: number): string {
    if (value < 10) return "低"
    if (value < 20) return "中"
    return "高"
}
