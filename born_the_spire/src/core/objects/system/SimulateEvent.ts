import { previewEffect } from "./effect/previewEffect"
import { Entity } from "./Entity"
import type { EffectUnit } from "./effect/EffectUnit"
import type { EventParticipant } from "@/core/types/event/EventParticipant"
import type { ActionEvent } from "./ActionEvent"

/**
 * 意图 / 卡面数字不再走假战斗。请用 previewEffect。
 * 这里只保留旧名字，避免外部 import 立刻断掉。
 */
export function simulateEffect(
    effectUnit: EffectUnit,
    source: EventParticipant,
    medium: EventParticipant,
    target: EventParticipant | EventParticipant[]
): EffectUnit {
    return previewEffect(effectUnit, source, medium, target)
}

export function simulateEvent(
    _key: string,
    source: EventParticipant,
    medium: EventParticipant,
    target: EventParticipant | EventParticipant[],
    effectUnits: EffectUnit[]
): EffectUnit[] {
    return effectUnits.map(unit => previewEffect(unit, source, medium, target))
}

export function isSimulateMode(event: ActionEvent): boolean {
    return event.simulate
}

export function simulateDamage(
    baseDamage: number,
    source: Entity,
    target: Entity
): number {
    const result = previewEffect(
        { key: "attack", params: { value: baseDamage } },
        source,
        source,
        target
    )
    return Number(result.params.value)
}

export function simulateBlock(
    baseBlock: number,
    source: Entity,
    target: Entity
): number {
    const result = previewEffect(
        { key: "gainArmor", params: { value: baseBlock } },
        source,
        source,
        target
    )
    return Number(result.params.value)
}
