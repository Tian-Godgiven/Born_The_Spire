/**
 * 卡面数字预览。意图和卡面共用 previewEffect：折叠 before / on 上的改参效果。
 */

import type { Card } from "@/core/objects/item/Subclass/Card"
import type { Entity } from "@/core/objects/system/Entity"
import type { EffectUnit } from "@/core/objects/system/effect/EffectUnit"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { previewEffect } from "@/core/objects/system/effect/previewEffect"

export interface PreviewResult {
    [effectKey: string]: number
}

const cardPreviewDummy: EventParticipant = {
    __id: "card-preview-dummy",
    participantType: "dummy" as any,
    label: "_previewDummy"
}

function firstTarget(target?: Entity | Entity[] | EventParticipant | EventParticipant[]): EventParticipant | undefined {
    if (target == null) return undefined
    return Array.isArray(target) ? target[0] : target
}

function foldedValue(unit: EffectUnit, source: Entity, medium: EventParticipant, target: EventParticipant): number {
    const folded = previewEffect(unit, source, medium, target)
    const base = Number(folded.params.value)
    const rawMul = folded.params.multiplier
    const mul = rawMul === undefined ? 1 : Number(rawMul)
    const value = base * (Number.isFinite(mul) ? mul : 1)
    return Number.isFinite(value) ? value : 0
}

function recordFolded(result: PreviewResult, unit: EffectUnit, value: number) {
    result[unit.key] = value
    if (unit.key === "attack" || unit.key === "damage") {
        result.damage = value
    }
    if (unit.key === "gainArmor") {
        result.armor = value
    }
    if (unit.key === "heal") {
        result.heal = value
    }
}

function foldUnits(
    units: EffectUnit[] | undefined,
    source: Entity,
    medium: EventParticipant,
    target: EventParticipant,
    result: PreviewResult,
    repeats: number
) {
    if (!units || repeats <= 0) return
    for (const unit of units) {
        if (unit.key === "repeatEffects") {
            const folded = previewEffect(unit, source, medium, target)
            const times = Number(folded.params.times)
            const inner = folded.params.effects
            if (!Number.isFinite(times) || times <= 0 || !Array.isArray(inner)) continue
            foldUnits(inner as EffectUnit[], source, medium, target, result, repeats * times)
            continue
        }
        if (unit.params?.value == null) continue
        recordFolded(result, unit, foldedValue(unit, source, medium, target) * repeats)
    }
}

export function previewCardEffects(
    card: Card,
    source: Entity,
    target?: Entity | Entity[]
): PreviewResult {
    const result: PreviewResult = {}
    const useInteraction = card.getInteraction("use")
    if (!useInteraction?.effects) return result

    const previewTarget = firstTarget(target) ?? cardPreviewDummy
    foldUnits(useInteraction.effects, source, card, previewTarget, result, 1)
    return result
}

export function previewEffectValue(
    card: Card,
    source: Entity,
    effectKey: string,
    target?: Entity | Entity[]
): number {
    const result = previewCardEffects(card, source, target)
    if (result[effectKey] !== undefined) return result[effectKey]
    if (effectKey === "damage") return result.attack ?? 0
    if (effectKey === "block") return result.gainArmor ?? result.armor ?? 0
    return 0
}

export const previewValue = (_event: any, effect: any): number => {
    return Number(effect.params.value) || 0
}

export const previewModifyValue = (_targetEffectKey: string) =>
    (_event: any, effect: any): number | null => {
        return Number(effect.params.delta) || 0
    }

export const previewModifyByPercent = (_targetEffectKey: string) =>
    (_event: any, effect: any): number | null => {
        return Number(effect.params.percent) || 0
    }
