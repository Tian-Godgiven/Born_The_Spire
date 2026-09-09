import { Card } from "@/core/objects/item/Subclass/Card"
import { previewEffect } from "./effect/previewEffect"
import { Entity } from "./Entity"
import type { EffectUnit } from "./effect/EffectUnit"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { nanoid } from "nanoid"

/**
 * 意图模拟用的虚拟目标
 *
 * 没传入真实目标时用这个空对象，避免误把玩家自己的飞行/易伤折进卡面。
 * 传入玩家后才会折叠受击方的 before take。
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

export type IntentPart = {
    type: IntentType
    value?: number
    count?: number
}

/**
 * 意图对象
 *
 * 表示敌人的行动意图，包含类型、数值和实际要执行的卡牌
 */
export type Intent = {
    type: IntentType            // 首段意图类型（兼容只读 type 的调用方）
    value?: number              // 首段显示数值
    count?: number               // 首段攻击次数
    parts: IntentPart[]        // 每张行动牌一段，多招并排展示
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
    attack: ["attack", "damage"],
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
 * 从卡牌的 use 效果推导意图类型
 *
 * 比 tag 准：技能牌可能是护甲、上毒或回血，不能一律当成防御。
 * 当 BehaviorPattern 没有声明 intent 时使用。
 */
function collectEffectKeys(units: EffectUnit[] | undefined, into: string[] = []): string[] {
    if (!units) return into
    for (const unit of units) {
        into.push(unit.key)
        const nested = unit.params?.effects
        if (Array.isArray(nested)) collectEffectKeys(nested as EffectUnit[], into)
    }
    return into
}

function useTargetHint(target: unknown): string | undefined {
    if (target == null) return undefined
    if (typeof target === "string") return target
    if (typeof target === "object") {
        const spec = target as { faction?: string, key?: string }
        return spec.faction ?? spec.key
    }
    return undefined
}

function inferIntentFromCard(card: Card): IntentType {
    const use = card.getInteraction("use")
    const keys = collectEffectKeys(use ? use.effects : undefined)
    if (keys.includes("attack") || keys.includes("damage")) return "attack"
    if (keys.includes("gainArmor")) return "defend"
    if (keys.includes("heal")) return "heal"
    if (keys.includes("applyState")) {
        const hint = useTargetHint(use ? use.target : undefined)
        if (hint === "self" || hint === "owner") return "buff"
        return "debuff"
    }
    if (card.tags?.includes("attack")) return "attack"
    if (card.tags?.includes("defence")) return "defend"
    if (card.tags?.includes("power")) return "buff"
    if (card.tags?.includes("curse")) return "debuff"
    return "special"
}

/**
 * 从卡牌列表分析生成意图
 *
 * 意图类型优先使用 BehaviorPattern 声明的 intentType，
 * 未声明时从所选卡牌的效果推导。
 * 意图数值从卡牌效果的 params.value 读取，再按 before 上的改参效果折叠（力量、易伤、飞行减半）。
 * multiplier 会乘进单段数值（放电 3×充能层）；repeatEffects 会展开成段数（群咬 3×2）。
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
    intentType?: IntentType | (IntentType | undefined)[],
    target?: Entity
): Promise<Intent> {
    if (cards.length === 0) {
        return { type: "unknown", parts: [{ type: "unknown" }], actions: [], visibility }
    }

    const simTarget = target ?? intentDummyTarget
    const parts: IntentPart[] = []

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const type = Array.isArray(intentType)
            ? (intentType[i] ?? inferIntentFromCard(card))
            : (intentType ?? inferIntentFromCard(card))
        parts.push(await computeIntentPart(card, type, owner, simTarget))
    }

    return {
        type: parts[0].type,
        value: parts[0].value,
        count: parts[0].count,
        parts,
        actions: cards,
        visibility
    }
}

async function computeIntentPart(
    card: Card,
    type: IntentType,
    owner: Entity,
    simTarget: EventParticipant
): Promise<IntentPart> {
    const effectKeys = intentValueSources[type]
    if (!effectKeys || effectKeys.length === 0) {
        return { type }
    }

    const hits: number[] = []

    const collectHits = async (units: EffectUnit[] | undefined, repeats: number) => {
        if (!units || repeats <= 0) return
        for (const unit of units) {
            if (unit.key === "repeatEffects") {
                const resolved = previewEffect(unit, owner, card, simTarget)
                const times = Number(resolved.params.times)
                const inner = resolved.params.effects
                if (!Number.isFinite(times) || times <= 0 || !Array.isArray(inner)) continue
                await collectHits(inner as EffectUnit[], repeats * times)
                continue
            }
            if (!effectKeys.includes(unit.key) || unit.params?.value == null) continue
            const simulated = previewEffect(unit, owner, card, simTarget)
            const base = Number(simulated.params.value)
            const rawMul = simulated.params.multiplier
            const mul = rawMul === undefined ? 1 : Number(rawMul)
            const perHit = base * (Number.isFinite(mul) ? mul : 1)
            if (!Number.isFinite(perHit)) continue
            for (let r = 0; r < repeats; r++) hits.push(perHit)
        }
    }

    await collectHits(card.getInteraction("use")?.effects, 1)

    if (hits.length === 0) return { type }

    const first = hits[0]
    const allSame = hits.every(value => value === first)
    if (allSame) {
        return { type, value: first, count: hits.length > 1 ? hits.length : undefined }
    }
    return { type, value: hits.reduce((sum, value) => sum + value, 0) }
}

/**
 * 根据可见性等级格式化意图显示
 *
 * @param intent 意图对象
 * @returns 格式化后的显示文本
 */
export function formatIntentDisplay(intent: Intent): string {
    const parts = intent.parts?.length ? intent.parts : [{ type: intent.type, value: intent.value, count: intent.count }]
    const formatPart = (part: IntentPart): string => {
        const typeName = getIntentTypeInfo(part.type)?.label || "未知"
        if (intent.visibility === "hidden") return "?"
        if (intent.visibility === "type") return typeName
        if (intent.visibility === "range" && part.value !== undefined) {
            return `${typeName}(${getValueRange(part.value)})`
        }
        if (part.value !== undefined) {
            const countText = part.count ? ` x${part.count}` : ""
            return `${typeName}: ${part.value}${countText}`
        }
        return typeName
    }

    if (intent.visibility === "card" && intent.actions.length > 0) {
        return intent.actions.map(card => card.displayName).join(" + ")
    }

    return parts.map(formatPart).join(" + ")
}

/**
 * 将数值转换为范围描述
 */
function getValueRange(value: number): string {
    if (value < 10) return "低"
    if (value < 20) return "中"
    return "高"
}
