/**
 * 状态触发器效果
 * 为各种状态（力量、易伤、虚弱等）添加触发器，让它们影响伤害计算
 */

import type { Entity } from "@/core/objects/system/Entity"
import { ifHaveStatus, getStatusValue } from "@/core/objects/system/status/Status"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 为实体添加力量(strength)触发器
 * 当实体造成伤害时，增加等于力量值的伤害
 */
export function applyStrengthTrigger(entity: Entity): void {
    if (!ifHaveStatus(entity, "strength")) {
        return
    }

    entity.trigger.appendTrigger({
        when: "before",
        how: "make",
        key: "damage",
        callback: async (event) => {
            const strengthValue = getStatusValue(entity, "strength", 0)
            if (strengthValue === 0) return

            // 生成修改伤害事件
            event.spawnEvent(await createModifyDamageEvent(
                entity,
                event.effects[0],
                strengthValue
            ))
        }
    })
}

/**
 * 为实体添加易伤(vulnerable)触发器
 * 当实体受到伤害时，伤害增加50%
 */
export function applyVulnerableTrigger(entity: Entity): void {
    if (!ifHaveStatus(entity, "vulnerable")) {
        return
    }

    entity.trigger.appendTrigger({
        when: "before",
        how: "take",
        key: "damage",
        callback: async (event) => {
            const vulnerableValue = getStatusValue(entity, "vulnerable", 0)
            if (vulnerableValue === 0) return

            // 生成修改伤害事件（增加50%）
            event.spawnEvent(await createModifyDamageByPercentEvent(
                entity,
                event.effects[0],
                0.5
            ))
        }
    })
}

/**
 * 为实体添加虚弱(weak)触发器
 * 当实体造成伤害时，伤害减少25%
 */
export function applyWeakTrigger(entity: Entity): void {
    if (!ifHaveStatus(entity, "weak")) {
        return
    }

    entity.trigger.appendTrigger({
        when: "before",
        how: "make",
        key: "damage",
        callback: async (event) => {
            const weakValue = getStatusValue(entity, "weak", 0)
            if (weakValue === 0) return

            // 生成修改伤害事件（减少25%）
            event.spawnEvent(await createModifyDamageByPercentEvent(
                entity,
                event.effects[0],
                -0.25
            ))
        }
    })
}

/**
 * 创建修改伤害值事件（加减固定值）
 */
async function createModifyDamageEvent(
    source: Entity,
    targetEffect: any,
    delta: number
) {
    

    return doEvent({
        key: "modifyDamage",
        source,
        medium: source,
        target: targetEffect,
        effectUnits: [{
            key: "modifyDamageValue",
            params: { delta }
        }]
    })
}

/**
 * 创建修改伤害百分比事件
 */
async function createModifyDamageByPercentEvent(
    source: Entity,
    targetEffect: any,
    percent: number
) {
    

    return doEvent({
        key: "modifyDamage",
        source,
        medium: source,
        target: targetEffect,
        effectUnits: [{
            key: "modifyDamageByPercent",
            params: { percent }
        }]
    })
}
