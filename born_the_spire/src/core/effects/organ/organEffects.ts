/**
 * 器官相关的效果函数
 */

import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { isEntity } from "@/core/utils/typeGuards"
import { Player } from "@/core/objects/target/Player"
import { Organ } from "@/core/objects/target/Organ"
import { hasTag } from "@/static/list/target/organTags"
import { OrganTags } from "@/static/list/target/organTags"
import { getCurrentValue, setCurrentValue } from "@/core/objects/system/Current/current"
import { createOrgan } from "@/core/factories"
import { doEvent } from "@/core/objects/system/ActionEvent"

/**
 * 替换器官效果
 * 将旧器官替换为新器官（保留等级）
 */
export const replaceOrgan: EffectFunc = async (event, effect) => {
    const { target, medium } = event
    const { organKey } = effect.params
    const keepLevel = effect.params.keepLevel !== false // 默认为 true

    // 需要动态导入 Organ 类用于 instanceof 检查
    // Organ 已静态导入

    // 验证 target 是 Entity（不能是数组）
    if (Array.isArray(target)) {
        newLog(["错误：replaceOrgan 效果的 target 不能是数组"])
        return
    }

    if (!isEntity(target)) {
        newLog(["错误：replaceOrgan 效果的 target 必须是单个实体"])
        return
    }

    // medium 应该是旧器官
    if (!(medium instanceof Organ)) {
        newLog(["错误：replaceOrgan 效果的 medium 必须是器官"])
        return
    }

    const oldOrgan = medium
    const organModifier = getOrganModifier(target)

    // 检查是否拥有旧器官
    if (!organModifier.getOrgans().includes(oldOrgan)) {
        newLog([target, "未拥有器官", oldOrgan])
        return
    }

    // 通过懒加载获取器官列表并创建新器官
    const organList = getLazyModule<any[]>('organList')
    const organData = organList.find((o: any) => o.key === organKey)
    if (!organData) {
        newLog(["错误：未找到器官", organKey])
        return
    }
    const newOrgan = await createOrgan(organData)

    // 如果保留等级，设置新器官的等级
    if (keepLevel) {
        newOrgan.level = oldOrgan.level
    }

    newLog([target, "器官进化！", oldOrgan, "→", newOrgan])

    // 移除旧器官
    organModifier.loseOrgan(oldOrgan, false)

    // 获得新器官
    organModifier.acquireOrgan(newOrgan, target)
}

/**
 * 选择器官移除
 *
 * @params {
 *   count?: number    - 可选择数量（默认1）
 *   minCount?: number - 最少选择数量（默认0）
 * }
 */
export const chooseOrganRemove: EffectFunc = async (event, effect) => {
    const target = Array.isArray(event.target) ? event.target[0] : event.target
    if (!(target instanceof Player)) return

    const { count = 1, minCount = 0 } = effect.params

    const organModifier = getOrganModifier(target)
    const organs = organModifier.getOrgans()

    if (organs.length === 0) {
        console.warn("[chooseOrganRemove] 玩家没有器官可移除")
        return
    }

    // 使用器官选择UI
    const { showOrganChoice } = await import("@/ui/hooks/interaction/organChoice")
    const result = await showOrganChoice({
        title: "选择要移除的器官",
        description: count === 1 ? "选择一个器官移除" : `选择最多 ${count} 个器官移除`,
        organKeys: organs.map(o => o.key),
        minSelect: Number(minCount),
        maxSelect: Number(count),
        cancelable: minCount === 0
    })

    // 对每个选中的器官创建移除事件
    
    for (const organKey of result.selectedKeys) {
        const organ = organs.find(o => o.key === organKey)
        if (organ) {
            await doEvent({
                key: "removeOrgan",
                source: target,
                medium: organ,
                target: target,
                effectUnits: [{
                    key: "removeOrgan",
                    params: { organ }
                }]
            })
        }
    }
}

/**
 * 对器官造成质量伤害
 *
 * @params {
 *   organ: Organ      - 目标器官
 *   value: number     - 伤害值
 * }
 */
export const damageOrgan: EffectFunc = async (_event, effect) => {
    // 动态导入 Organ 类用于 instanceof 检查
    // Organ 已静态导入

    const { organ, value } = effect.params

    if (!(organ instanceof Organ)) {
        newLog(["错误：damageOrgan 效果的 organ 参数必须是器官对象"])
        return
    }

    // 检查器官是否有质量系统
    if (!organ.status["max-mass"]) {
        console.warn(`[damageOrgan] 器官 ${organ.label} 没有质量系统，跳过伤害`)
        return
    }

    const damage = Number(value) || 0
    if (damage <= 0) return

    // 获取当前质量
    const currentMass = getCurrentValue(organ, "mass")
    const newMass = Math.max(0, currentMass - damage)

    // 设置新质量
    setCurrentValue(organ, "mass", newMass)

    newLog([organ, `质量受损 -${damage}`, `(${currentMass} → ${newMass})`])

    // 检查是否质量归0且需要损坏
    if (newMass === 0 && !organ.isDisabled) {
        // 检查是否有不朽标签
        if (hasTag(organ.tags, OrganTags.INDESTRUCTIBLE)) {
            newLog([organ, "质量归0，但因【不朽】标签而未损坏"])
            return
        }

        // 触发损坏
        if (organ.owner) {
            const organModifier = getOrganModifier(organ.owner)
            organModifier.breakOrgan(organ)
        } else {
            newLog([organ, "质量归0但无持有者，无法触发损坏"])
        }
    }
}

/**
 * 恢复器官质量
 *
 * @params {
 *   organ: Organ      - 目标器官
 *   value: number     - 恢复值
 * }
 */
export const healOrgan: EffectFunc = async (_event, effect) => {
    // 动态导入 Organ 类用于 instanceof 检查
    // Organ 已静态导入

    const { organ, value } = effect.params

    if (!(organ instanceof Organ)) {
        newLog(["错误：healOrgan 效果的 organ 参数必须是器官对象"])
        return
    }

    // 检查器官是否有质量系统
    if (!organ.status["max-mass"]) {
        console.warn(`[healOrgan] 器官 ${organ.label} 没有质量系统，跳过恢复`)
        return
    }

    const heal = Number(value) || 0
    if (heal <= 0) return

    // 获取当前质量和最大质量
    const currentMass = getCurrentValue(organ, "mass")
    const maxMass = Number(organ.status["max-mass"].value)
    const newMass = Math.min(maxMass, currentMass + heal)

    // 设置新质量
    setCurrentValue(organ, "mass", newMass)

    newLog([organ, `质量恢复 +${heal}`, `(${currentMass} → ${newMass})`])
}
