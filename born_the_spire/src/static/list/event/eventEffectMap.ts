/**
 * 事件效果映射表
 * 提供原子效果供 mod 作者组合使用
 */

import { nowPlayer } from "@/core/objects/game/run"
import { newLog } from "@/ui/hooks/global/log"

/**
 * 事件效果函数类型
 */
export type EventEffectFunc = (params?: any) => void | Promise<void>

/**
 * 事件效果映射表
 */
export const eventEffectMap: Record<string, EventEffectFunc> = {
    /**
     * 获得物质
     */
    "gainMaterial": async (params: { amount: number }) => {
        newLog([`获得 ${params.amount} 物质`])
        // TODO: nowPlayer.addMaterial(params.amount)
    },

    /**
     * 失去物质
     */
    "loseMaterial": async (params: { amount: number }) => {
        newLog([`失去 ${params.amount} 物质`])
        // TODO: nowPlayer.spendMaterial(params.amount)
    },

    /**
     * 获得金钱
     */
    "gainGold": async (params: { amount: number }) => {
        newLog([`获得 ${params.amount} 金钱`])
        // TODO: nowPlayer.addGold(params.amount)
    },

    /**
     * 失去金钱
     */
    "loseGold": async (params: { amount: number }) => {
        newLog([`失去 ${params.amount} 金钱`])
        // TODO: nowPlayer.spendGold(params.amount)
    },

    /**
     * 回复生命
     */
    "healHealth": async (params: { amount: number }) => {
        newLog([`回复 ${params.amount} 生命`])
        // TODO: nowPlayer.heal(params.amount)
    },

    /**
     * 失去生命
     */
    "loseHealth": async (params: { amount: number }) => {
        newLog([`失去 ${params.amount} 生命`])
        // TODO: nowPlayer.takeDamage(params.amount)
    },

    /**
     * 获得最大生命
     */
    "gainMaxHealth": async (params: { amount: number }) => {
        newLog([`获得 ${params.amount} 最大生命`])
        // TODO: nowPlayer.addMaxHealth(params.amount)
    },

    /**
     * 获得遗物
     */
    "gainRelic": async (params: { relicKey: string }) => {
        newLog([`获得遗物: ${params.relicKey}`])
        // TODO: nowPlayer.addRelic(params.relicKey)
    },

    /**
     * 获得药水
     */
    "gainPotion": async (params: { potionKey: string }) => {
        newLog([`获得药水: ${params.potionKey}`])
        // TODO: nowPlayer.addPotion(params.potionKey)
    },

    /**
     * 获得卡牌
     */
    "gainCard": async (params: { cardKey: string }) => {
        newLog([`获得卡牌: ${params.cardKey}`])
        // TODO: nowPlayer.addCard(params.cardKey)
    },

    /**
     * 移除卡牌
     */
    "removeCard": async (params: { cardKey: string }) => {
        newLog([`移除卡牌: ${params.cardKey}`])
        // TODO: nowPlayer.removeCard(params.cardKey)
    },

    /**
     * 升级卡牌
     */
    "upgradeCard": async (params: { cardKey: string }) => {
        newLog([`升级卡牌: ${params.cardKey}`])
        // TODO: nowPlayer.upgradeCard(params.cardKey)
    },

    /**
     * 获得器官
     */
    "gainOrgan": async (params: { organKey: string }) => {
        newLog([`获得器官: ${params.organKey}`])
        // TODO: nowPlayer.addOrgan(params.organKey)
    },

    /**
     * 移除器官
     */
    "removeOrgan": async (params: { organKey: string }) => {
        newLog([`移除器官: ${params.organKey}`])
        // TODO: nowPlayer.removeOrgan(params.organKey)
    },

    /**
     * 随机获得遗物
     */
    "gainRandomRelic": async (params?: { count?: number }) => {
        const count = params?.count || 1
        newLog([`随机获得 ${count} 个遗物`])
        // TODO: 从遗物池中随机抽取
    },

    /**
     * 随机获得药水
     */
    "gainRandomPotion": async (params?: { count?: number }) => {
        const count = params?.count || 1
        newLog([`随机获得 ${count} 个药水`])
        // TODO: 从药水池中随机抽取
    },

    /**
     * 随机获得卡牌
     */
    "gainRandomCard": async (params?: { count?: number, rarity?: string }) => {
        const count = params?.count || 1
        newLog([`随机获得 ${count} 张卡牌`])
        // TODO: 从卡牌池中随机抽取
    },

    /**
     * 打开宝箱（随机奖励）
     */
    "openChest": async () => {
        newLog(["打开宝箱..."])
        // TODO: 随机给予奖励
    },

    /**
     * 无事发生
     */
    "nothing": async () => {
        newLog(["什么也没有发生"])
    }
}

/**
 * 执行事件效果
 * @param effectKey 效果 key
 * @param params 效果参数
 */
export async function executeEventEffect(effectKey: string, params?: any): Promise<void> {
    const effectFunc = eventEffectMap[effectKey]
    if (!effectFunc) {
        console.error(`[EventEffect] 未找到事件效果: ${effectKey}`)
        return
    }

    await effectFunc(params)
}

/**
 * 批量执行事件效果
 * @param effects 效果列表
 */
export async function executeEventEffects(effects: Array<{ key: string; params?: any }>): Promise<void> {
    for (const effect of effects) {
        await executeEventEffect(effect.key, effect.params)
    }
}
