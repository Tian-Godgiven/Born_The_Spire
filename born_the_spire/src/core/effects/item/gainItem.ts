/**
 * 物品获得相关的效果函数
 */

import { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { newLog } from "@/ui/hooks/global/log"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"
import { getPotionModifier } from "@/core/objects/system/modifier/PotionModifier"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { isEntity } from "@/core/utils/typeGuards"
import { Player } from "@/core/objects/target/Player"
import { Enemy } from "@/core/objects/target/Enemy"

/**
 * 获得卡牌效果
 *
 * params:
 * - cardKey: 卡牌 key
 */
export const gainCard: EffectFunc = async (event, effect) => {
    const cardKey = String(effect.params.cardKey)

    if (!cardKey) {
        console.error("[gainCard] 缺少必要参数 cardKey", effect.params)
        return
    }

    const target = event.target
    if (Array.isArray(target)) {
        console.error("[gainCard] target 不能是数组")
        return
    }

    if (!isEntity(target)) {
        console.error("[gainCard] target 必须是实体")
        return
    }

    // 检查是否是 Chara 类型（Player 或 Enemy）
    if (!(target instanceof Player) && !(target instanceof Enemy)) {
        console.error("[gainCard] target 必须是 Player 或 Enemy")
        return
    }

    const cardModifier = getCardModifier(target)
    cardModifier.addCardsFromSource(target, [cardKey])

    newLog([target, "获得了卡牌", cardKey])
}

/**
 * 获得药水效果
 *
 * params:
 * - potionKey: 药水 key
 */
export const gainPotion: EffectFunc = async (event, effect) => {
    const potionKey = String(effect.params.potionKey)

    if (!potionKey) {
        console.error("[gainPotion] 缺少必要参数 potionKey", effect.params)
        return
    }

    const target = event.target
    if (Array.isArray(target)) {
        console.error("[gainPotion] target 不能是数组")
        return
    }

    if (!isEntity(target)) {
        console.error("[gainPotion] target 必须是实体")
        return
    }

    const { getPotionByKey } = await import("@/static/list/item/potionList")
    const potion = await getPotionByKey(potionKey)

    if (!potion) {
        console.error("[gainPotion] 未找到药水", potionKey)
        return
    }

    const potionModifier = getPotionModifier(target)
    potionModifier.acquirePotion(potion, target)

    newLog([target, "获得了药水", potion.label])
}

/**
 * 获得遗物效果
 *
 * params:
 * - relicKey: 遗物 key
 */
export const gainRelic: EffectFunc = async (event, effect) => {
    const relicKey = String(effect.params.relicKey)

    if (!relicKey) {
        console.error("[gainRelic] 缺少必要参数 relicKey", effect.params)
        return
    }

    const target = event.target
    if (Array.isArray(target)) {
        console.error("[gainRelic] target 不能是数组")
        return
    }

    if (!isEntity(target)) {
        console.error("[gainRelic] target 必须是实体")
        return
    }

    const relicModifier = getRelicModifier(target)
    relicModifier.acquireRelicsFromKeys([relicKey], target)

    newLog([target, "获得了遗物", relicKey])
}

/**
 * 获得器官效果
 *
 * params:
 * - organKey: 器官 key
 */
export const gainOrgan: EffectFunc = async (event, effect) => {
    const organKey = String(effect.params.organKey)

    if (!organKey) {
        console.error("[gainOrgan] 缺少必要参数 organKey", effect.params)
        return
    }

    const target = event.target
    if (Array.isArray(target)) {
        console.error("[gainOrgan] target 不能是数组")
        return
    }

    if (!isEntity(target)) {
        console.error("[gainOrgan] target 必须是实体")
        return
    }

    // 动态导入避免循环依赖
    const { Organ } = await import("@/core/objects/target/Organ")

    const organList = getLazyModule<any[]>('organList')
    const organData = organList.find((o: any) => o.key === organKey)

    if (!organData) {
        console.error("[gainOrgan] 未找到器官", organKey)
        return
    }

    const organ = new Organ(organData)
    const organModifier = getOrganModifier(target)
    organModifier.acquireOrgan(organ, target)

    newLog([target, "获得了器官", organ.label])
}
