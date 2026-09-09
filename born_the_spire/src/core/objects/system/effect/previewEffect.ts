import { cloneDeep } from "lodash"
import { ActionEvent } from "../ActionEvent"
import type { Effect } from "./Effect"
import type { EffectUnit } from "./EffectUnit"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 把一条效果的 params 折成预览值。
 *
 * 只跑三方 before 触发器上挂的 preview（modifyDamage* / modifyArmorValue 等）。
 * 不发事件、不开事务、不扣层、不掷骰。
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

    applyBeforePreviews(effect, source, "make")
    applyBeforePreviews(effect, medium, "via")
    const targets = Array.isArray(target) ? target : [target]
    for (const one of targets) {
        applyBeforePreviews(effect, one, "take")
    }

    return {
        key: effect.key,
        params: { ...effect.params },
        describe: effect.describe
    }
}

function applyBeforePreviews(
    effect: Effect,
    participant: EventParticipant,
    how: "make" | "via" | "take"
) {
    if (!isEntity(participant)) return
    const units = participant.trigger.getTriggers("before", how, effect.key)
    if (!units || units.length === 0) return
    const sorted = [...units].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
    for (const unit of sorted) {
        unit.preview?.(effect)
    }
}
