import { cloneDeep } from "lodash"
import { ActionEvent } from "../ActionEvent"
import type { Effect } from "./Effect"
import type { EffectUnit } from "./EffectUnit"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 把一条效果的 params 折成预览值。
 *
 * 跑三方 before / on 上挂的 preview（modifyDamage* / modifyArmorValue 等）。
 * 不跑 after（事后响应，改不了这条效果的数字）。
 * 不发事件、不开事务、不扣层、不掷骰、不吸收护甲。
 */
export function previewEffect(
    effectUnit: EffectUnit,
    source: EventParticipant,
    medium: EventParticipant,
    target: EventParticipant | EventParticipant[]
): EffectUnit {
    const mockUnit = cloneDeep(effectUnit)
    const mockEvent = new ActionEvent(
        mockUnit.key,
        source,
        medium,
        target,
        {},
        [mockUnit]
    )
    const effect = mockEvent.effects[0]
    if (!effect) {
        return { key: mockUnit.key, params: mockUnit.params, describe: mockUnit.describe }
    }

    const targets = Array.isArray(target) ? target : [target]
    applyPhasePreviews(effect, source, medium, targets, "before")
    applyPhasePreviews(effect, source, medium, targets, "on")

    return {
        key: effect.key,
        params: { ...effect.params },
        describe: effect.describe
    }
}

function applyPhasePreviews(
    effect: Effect,
    source: EventParticipant,
    medium: EventParticipant,
    targets: EventParticipant[],
    when: "before" | "on"
) {
    applyHowPreviews(effect, source, "make", when)
    applyHowPreviews(effect, medium, "via", when)
    for (const one of targets) {
        applyHowPreviews(effect, one, "take", when)
    }
}

function applyHowPreviews(
    effect: Effect,
    participant: EventParticipant,
    how: "make" | "via" | "take",
    when: "before" | "on"
) {
    if (!isEntity(participant)) return
    const units = participant.trigger.getTriggers(when, how, effect.key)
    if (!units || units.length === 0) return
    const sorted = [...units].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
    for (const unit of sorted) {
        unit.preview?.(effect)
    }
}
