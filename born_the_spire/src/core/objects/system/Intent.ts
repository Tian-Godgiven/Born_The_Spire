import { Card } from "@/core/objects/item/Subclass/Card"
import { getStatusValue, ifHaveStatus } from "@/core/objects/system/status/Status"
import { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import { simulateDamage, simulateBlock } from "./SimulateEvent"
import { Entity } from "./Entity"

/**
 * 意图类型
 *
 * 敌人行动的意图分类，用于向玩家展示敌人下回合的行动
 */
export type IntentType = "attack" | "defend" | "buff" | "debuff" | "unknown" | "special"

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
 * 从卡牌列表分析生成意图
 *
 * 使用卡牌的 tag 确定意图类型，从卡牌属性读取数值
 *
 * @param cards 要执行的卡牌列表
 * @param owner 卡牌持有者（用于计算 Buff 影响）
 * @param visibility 可见性等级（默认为 exact）
 * @returns 意图对象
 */
export function cardsToIntent(
    cards: Card[],
    owner: Entity,  // 改为 Entity 类型
    visibility: IntentVisibility = "exact"
): Intent {
    if (cards.length === 0) {
        return {
            type: "unknown",
            actions: [],
            visibility
        }
    }

    // 根据第一张卡的 tag 确定意图类型
    const primaryCard = cards[0]
    let intentType: IntentType = "unknown"

    if (primaryCard.tags?.includes("attack")) {
        intentType = "attack"
    } else if (primaryCard.tags?.includes("skill")) {
        intentType = "defend"  // skill 默认为防御，后续可根据具体属性调整
    } else if (primaryCard.tags?.includes("power")) {
        intentType = "buff"
    } else if (primaryCard.tags?.includes("curse")) {
        intentType = "debuff"
    } else {
        intentType = "special"
    }

    // 根据意图类型计算数值
    let intentValue: number | undefined = undefined
    let intentCount: number | undefined = undefined

    if (intentType === "attack") {
        // 攻击意图：累加所有卡牌的伤害
        let totalDamage = 0
        let attackCount = 0

        for (const card of cards) {
            if (card.tags?.includes("attack")) {
                const baseDamage = ifHaveStatus(card, "damage")
                    ? getStatusValue(card, "damage")
                    : 0

                // 临时计算：应用力量 Buff
                const finalDamage = calculateDamageWithBuffs(baseDamage, owner)

                totalDamage += finalDamage
                attackCount++
            }
        }

        intentValue = totalDamage
        if (attackCount > 1) {
            intentCount = attackCount
        }
    } else if (intentType === "defend") {
        // 防御意图：累加所有卡牌的格挡
        let totalBlock = 0

        for (const card of cards) {
            if (ifHaveStatus(card, "block")) {
                const baseBlock = getStatusValue(card, "block")
                // 临时计算：应用敏捷 Buff（如果有的话）
                const finalBlock = calculateBlockWithBuffs(baseBlock, owner)
                totalBlock += finalBlock
            }
        }

        intentValue = totalBlock
    }
    // buff/debuff/special 类型暂不显示数值

    return {
        type: intentType,
        value: intentValue,
        count: intentCount,
        actions: cards,
        visibility
    }
}

/**
 * 计算受 Buff 影响后的伤害
 *
 * 使用事件模拟系统，应用力量、虚弱等 Buff 的影响
 *
 * @param baseDamage 基础伤害
 * @param owner 卡牌持有者
 * @returns 最终伤害
 */
function calculateDamageWithBuffs(baseDamage: number, owner: Entity): number {
    // 使用事件模拟系统计算受 Buff 影响后的伤害
    // 这会触发所有相关触发器（如力量、虚弱），但不实际执行效果

    // 假设目标是玩家（敌人攻击玩家的场景）
    // TODO: 这里需要传入实际的目标，可能需要调整 cardsToIntent 的参数
    const finalDamage = simulateDamage(baseDamage, owner, owner)

    return finalDamage
}

/**
 * 计算受 Buff 影响后的格挡
 *
 * 使用事件模拟系统，应用敏捷等 Buff 的影响
 *
 * @param baseBlock 基础格挡
 * @param owner 卡牌持有者
 * @returns 最终格挡
 */
function calculateBlockWithBuffs(baseBlock: number, owner: Entity): number {
    // 使用事件模拟系统计算受 Buff 影响后的格挡
    const finalBlock = simulateBlock(baseBlock, owner, owner)

    return finalBlock
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
