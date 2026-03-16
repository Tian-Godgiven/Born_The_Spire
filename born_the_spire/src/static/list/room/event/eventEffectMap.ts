/**
 * 事件效果映射表
 * 提供原子效果供 mod 作者组合使用
 */

import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { nowPlayer } from "@/core/objects/game/run"

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
        // nowPlayer.addMaterial(params.amount)
    },

    /**
     * 失去物质
     */
    "loseMaterial": async (params: { amount: number }) => {
        newLog([`失去 ${params.amount} 物质`])
        // nowPlayer.spendMaterial(params.amount)
    },

    /**
     * 获得金钱
     */
    "gainGold": async (params: { amount: number }) => {
        await doEvent({
            key: "gainReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainReserve",
                params: { reserveKey: "gold", amount: params.amount }
            }]
        })
    },

    /**
     * 失去金钱
     */
    "loseGold": async (params: { amount: number }) => {
        await doEvent({
            key: "spendReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "spendReserve",
                params: { reserveKey: "gold", amount: params.amount }
            }]
        })
    },

    /**
     * 回复生命
     */
    "healHealth": async (params: { amount: number }) => {
        await doEvent({
            key: "heal",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "heal",
                params: { value: params.amount }
            }]
        })
    },

    /**
     * 失去生命
     */
    "loseHealth": async (params: { amount: number }) => {
        await doEvent({
            key: "damage",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "damage",
                params: { value: params.amount }
            }]
        })
    },

    /**
     * 获得最大生命
     */
    "gainMaxHealth": async (params: { amount: number }) => {
        await doEvent({
            key: "gainMaxHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainMaxHealth",
                params: { value: params.amount }
            }]
        })
    },

    /**
     * 获得遗物
     */
    "gainRelic": async (params: { relicKey: string }) => {
        await doEvent({
            key: "gainRelic",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainRelic",
                params: { relicKey: params.relicKey }
            }]
        })
    },

    /**
     * 获得药水
     */
    "gainPotion": async (params: { potionKey: string }) => {
        await doEvent({
            key: "gainPotion",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainPotion",
                params: { potionKey: params.potionKey }
            }]
        })
    },

    /**
     * 获得卡牌
     */
    "gainCard": async (params: { cardKey: string }) => {
        await doEvent({
            key: "gainCard",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainCard",
                params: { cardKey: params.cardKey }
            }]
        })
    },

    /**
     * 移除卡牌
     */
    "removeCard": async (params: { count?: number, minCount?: number }) => {
        // 使用 chooseCardRemove 让玩家选择
        await doEvent({
            key: "chooseCardRemove",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "chooseCardRemove",
                params: {
                    count: params.count ?? 1,
                    minCount: params.minCount ?? 0
                }
            }]
        })
    },

    /**
     * 升级卡牌
     */
    "upgradeCard": async (params: { count?: number }) => {
        // 使用 chooseCardUpgrade 让玩家选择
        await doEvent({
            key: "chooseCardUpgrade",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "chooseCardUpgrade",
                params: {
                    count: params.count ?? 1
                }
            }]
        })
    },

    /**
     * 获得器官
     */
    "gainOrgan": async (params: { organKey: string }) => {
        await doEvent({
            key: "gainOrgan",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainOrgan",
                params: { organKey: params.organKey }
            }]
        })
    },

    /**
     * 移除器官
     */
    "removeOrgan": async (params: { count?: number, minCount?: number }) => {
        // 使用 chooseOrganRemove 让玩家选择
        await doEvent({
            key: "chooseOrganRemove",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "chooseOrganRemove",
                params: {
                    count: params.count ?? 1,
                    minCount: params.minCount ?? 0
                }
            }]
        })
    },

    /**
     * 随机获得遗物
     */
    "gainRandomRelic": async (params?: { count?: number }) => {
        const count = params?.count || 1
        const { getLazyModule } = await import("@/core/utils/lazyLoader")
        const relicList = getLazyModule<any[]>('relicList')
        const { randomChoices } = await import("@/core/hooks/random")

        // 随机选择遗物
        const selected = randomChoices(relicList, count, "gainRandomRelic")

        for (const relicData of selected) {
            await doEvent({
                key: "gainRelic",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainRelic",
                    params: { relicKey: relicData.key }
                }]
            })
        }
    },

    /**
     * 随机获得药水
     */
    "gainRandomPotion": async (params?: { count?: number }) => {
        const count = params?.count || 1
        const { getLazyModule } = await import("@/core/utils/lazyLoader")
        const potionList = getLazyModule<any[]>('potionList')
        const { randomChoices } = await import("@/core/hooks/random")

        // 随机选择药水
        const selected = randomChoices(potionList, count, "gainRandomPotion")

        for (const potionData of selected) {
            await doEvent({
                key: "gainPotion",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainPotion",
                    params: { potionKey: potionData.key }
                }]
            })
        }
    },

    /**
     * 随机获得卡牌
     */
    "gainRandomCard": async (params?: { count?: number, rarity?: string }) => {
        const count = params?.count || 1
        const { getLazyModule } = await import("@/core/utils/lazyLoader")
        const cardList = getLazyModule<any[]>('cardList')
        const { randomChoices } = await import("@/core/hooks/random")

        // 根据稀有度筛选（如果指定）
        let filteredCards = cardList
        if (params?.rarity) {
            filteredCards = cardList.filter((c: any) => c.rarity === params.rarity)
        }

        // 随机选择卡牌
        const selected = randomChoices(filteredCards, count, "gainRandomCard")

        for (const cardData of selected) {
            await doEvent({
                key: "gainCard",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainCard",
                    params: { cardKey: cardData.key }
                }]
            })
        }
    },

    /**
     * 随机升级卡牌
     * @param count 升级数量（默认1）
     * @param tags 筛选标签（如 ["attack"]，可选）
     */
    "upgradeRandomCards": async (params?: { count?: number, tags?: string[] }) => {
        const count = params?.count || 1
        const tags = params?.tags || []
        const { randomChoices } = await import("@/core/hooks/random")

        // 获取玩家卡组
        let cards = nowPlayer.getCardGroup()

        // 按标签筛选
        if (tags.length > 0) {
            cards = cards.filter(card =>
                card.tags?.some(tag => tags.includes(tag)) ?? false
            )
        }

        if (cards.length === 0) {
            newLog(["没有符合条件的卡牌可升级"])
            return
        }

        // 随机选择卡牌
        const selected = randomChoices(cards, Math.min(count, cards.length), "upgradeRandomCards")

        // 对每张卡牌调用升级效果
        for (const card of selected) {
            await doEvent({
                key: "upgradeCard",
                source: nowPlayer,
                medium: card,
                target: nowPlayer,
                effectUnits: [{
                    key: "upgradeCard",
                    params: { card }
                }]
            })
        }
    },

    /**
     * 打开宝箱（随机奖励）
     */
    "openChest": async () => {
        newLog(["打开宝箱..."])
        // 随机给予奖励
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
