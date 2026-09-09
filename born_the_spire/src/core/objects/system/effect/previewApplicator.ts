import type { Effect } from "./Effect"
import type { EffectUnit } from "./EffectUnit"
import type { TriggerEventConfig, TriggerCondition } from "@/core/types/object/trigger"
import type { Condition } from "@/core/types/ConditionSystem"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import type { Entity } from "../Entity"
import { checkCondition } from "@/core/types/ConditionSystem"
import { resolveReference } from "@/core/utils/ReferenceResolver"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { nowBattle } from "@/core/objects/game/battle"
import { cloneDeep } from "lodash"

/**
 * 预览会折叠进数字的 EffectFunc。只改 params，不掷骰、不扣层、不写世界。
 * 过期隔板那种 organ_* 专属效果不在这里，预览直接跳过。
 */
export const PREVIEW_PARAM_MODIFIER_KEYS = new Set([
    "modifyDamageValue",
    "modifyDamageByPercent",
    "reduceDamageValue",
    "modifyArmorValue",
])

export function isPreviewParamModifier(key: string): boolean {
    return PREVIEW_PARAM_MODIFIER_KEYS.has(key)
}

export function reactionHasPreviewableModifier(reactionEvents: TriggerEventConfig[] | undefined): boolean {
    if (!reactionEvents) return false
    return reactionEvents.some(config =>
        config.targetType === "triggerEffect"
        && (config.effect ?? []).some(unit => isPreviewParamModifier(unit.key))
    )
}

export type PreviewApplicator = {
    preview: (effect: Effect) => void
}

type PreviewApplicatorParams = {
    reactionEvents: TriggerEventConfig[]
    condition?: Condition | TriggerCondition
    item: EventParticipant
    owner: Entity
    extraCheck?: () => boolean
}

function isDslCondition(condition: Condition | TriggerCondition): condition is Condition {
    return typeof condition === "string"
        || Array.isArray(condition)
        || (typeof condition === "object" && ("and" in condition || "or" in condition || "not" in condition))
}

function conditionPasses(
    condition: Condition | TriggerCondition | undefined,
    item: EventParticipant,
    owner: Entity,
    effect: Effect
): boolean {
    if (!condition) return true
    if (!isDslCondition(condition)) return true
    const event = effect.actionEvent
    return checkCondition(condition, {
        item: item as any,
        owner,
        source: item as any,
        target: event.target as any,
        event,
        triggerSource: item as any,
        triggerOwner: owner,
        triggerEffect: effect,
        battle: nowBattle.value
    })
}

function applyParamModifier(previewed: Effect, unit: EffectUnit, item: EventParticipant) {
    if (!isPreviewParamModifier(unit.key)) return
    const effectMap = getLazyModule<any[]>("effectMap")
    const def = effectMap.find((entry: any) => entry.key === unit.key)
    if (!def || typeof def.effect !== "function") return

    const event = previewed.actionEvent
    const stubEvent = {
        target: previewed,
        source: item,
        medium: item,
        key: unit.key,
        simulate: false,
    }
    const resolvedParams: Record<string, unknown> = {}
    const rawParams = cloneDeep(unit.params ?? {})
    const context = {
        source: item,
        medium: item,
        target: previewed,
        owner: item as any,
        item: item as any,
        event,
        triggerEffect: previewed,
        lazyResolve: false,
        battle: nowBattle.value
    }
    for (const key of Object.keys(rawParams)) {
        resolvedParams[key] = resolveReference((rawParams as any)[key], context)
    }
    def.effect(stubEvent as any, { key: unit.key, params: resolvedParams })
}

/**
 * 给声明式触发器挂上预览折叠。真正结算仍走 callback / doEvent。
 */
export function createPreviewApplicator(params: PreviewApplicatorParams): PreviewApplicator | undefined {
    const { reactionEvents, condition, item, owner, extraCheck } = params
    if (!reactionHasPreviewableModifier(reactionEvents)) return undefined

    return {
        preview(effect: Effect) {
            if (extraCheck && !extraCheck()) return
            if (!conditionPasses(condition, item, owner, effect)) return
            for (const config of reactionEvents) {
                if (config.targetType !== "triggerEffect") continue
                if (config.condition && !conditionPasses(config.condition, item, owner, effect)) continue
                for (const unit of config.effect ?? []) {
                    applyParamModifier(effect, unit, item)
                }
            }
        }
    }
}
