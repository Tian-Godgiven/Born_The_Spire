/**
 * 器官相关的效果函数
 */

import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { isEntity } from "@/core/utils/typeGuards"

/**
 * 替换器官效果
 * 将旧器官替换为新器官（保留等级）
 */
export const replaceOrgan: EffectFunc = async (event, effect) => {
    const { target, medium } = event
    const { organKey } = effect.params
    const keepLevel = effect.params.keepLevel !== false // 默认为 true

    // 动态导入避免循环依赖
    const { Organ } = await import("@/core/objects/target/Organ")

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
    const newOrgan = new Organ(organData)

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
