/**
 * 事件效果映射表
 * 提供原子效果供 mod 作者组合使用
 */

import { newLog } from "@/ui/hooks/global/log"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { nowPlayer } from "@/core/objects/game/run"
import { getLazyModule } from "@/core/utils/lazyLoader"
import { randomChoices, randomChoice, randomChance, randomWeightedChoice, randomInt } from "@/core/hooks/random"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { showRandomCardShowcase } from "@/ui/hooks/interaction/randomCardShowcase"
import { getReserveModifier } from "@/core/objects/system/modifier/ReserveModifier"
import { getPotionModifier } from "@/core/objects/system/modifier/PotionModifier"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { createOrgan } from "@/core/factories"
import { GOD_OF_CHANCE_MAX_ROUND, godOfChanceIsHouseFirst } from "./godOfChance"

/**
 * 事件效果函数类型
 */
export type EventEffectFunc = (params?: any) => any | Promise<any>

/**
 * 事件效果映射表
 */
export const eventEffectMap: Record<string, EventEffectFunc> = {
    /**
     * 获得物质
     */
    "gainMaterial": async (params: { amount: number }) => {
        await doEvent({
            key: "gainReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainReserve",
                params: { reserveKey: "material", amount: params.amount }
            }]
        })
    },

    /**
     * 失去物质
     */
    "loseMaterial": async (params: { amount: number }) => {
        await doEvent({
            key: "spendReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "spendReserve",
                params: { reserveKey: "material", amount: params.amount }
            }]
        })
    },

    /**
     * 获得金钱。amount 固定值；min+max 则在闭区间内随机（含两端）。
     */
    "gainGold": async (params: { amount?: number, min?: number, max?: number }) => {
        let amount = params.amount ?? 0
        if (params.min != null && params.max != null) {
            amount = randomInt(params.min, params.max, "gainGold")
        }
        if (amount <= 0) return
        await doEvent({
            key: "gainReserve",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "gainReserve",
                params: { reserveKey: "gold", amount }
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
    "healHealth": async (params: { amount?: number, percent?: number, divisor?: number }) => {
        let healValue = params.amount ?? 0
        const maxHealth = (nowPlayer.status["max-health"]?.value ?? 0) as number
        if (params.divisor) {
            healValue = Math.floor(maxHealth / params.divisor)
        } else if (params.percent) {
            healValue = Math.floor(maxHealth * params.percent / 100)
        }
        if (healValue <= 0) return
        // restHeal：休息治疗事件通路，饥饿的怪物≥3陪睡等"仅休息触发"的效果监听此事件
        await doEvent({
            key: "restHeal",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "heal",
                params: { value: healValue }
            }]
        })
    },

    /**
     * 失去生命（直接扣血，绕过伤害流水线）
     */
    "loseHealth": async (params: { amount: number }) => {
        await doEvent({
            key: "loseHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "loseHealth",
                params: { value: params.amount }
            }]
        })
    },

    /**
     * 按百分比失去生命（基于最大生命值）。
     * notLethal：至少留 1 点当前生命。
     */
    "loseHealthPercent": async (params: { percent: number, notLethal?: boolean }) => {
        const maxHealth = (nowPlayer.status["max-health"]?.value ?? 0) as number
        let loseValue = Math.floor(maxHealth * params.percent / 100)
        if (params.notLethal) {
            const hp = getCurrentValue(nowPlayer, "health", 0)
            loseValue = Math.min(loseValue, Math.max(0, hp - 1))
        }
        if (loseValue <= 0) return
        await doEvent({
            key: "loseHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "loseHealth",
                params: { value: loseValue }
            }]
        })
    },

    /**
     * 按百分比失去最大生命（永久减少）
     */
    "loseMaxHealthPercent": async (params: { percent: number }) => {
        const maxHealth = (nowPlayer.status["max-health"]?.value ?? 0) as number
        const loseValue = Math.floor(maxHealth * params.percent / 100)
        if (loseValue <= 0) return
        await doEvent({
            key: "loseMaxHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "addMaxHealthAndHeal",
                params: { value: -loseValue }
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
                key: "addMaxHealthAndHeal",
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
     * 给玩家挂状态
     */
    "gainState": async (params: { stateKey: string, stacks?: number }) => {
        await doEvent({
            key: "applyState",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "applyState",
                params: { stateKey: params.stateKey, stacks: params.stacks ?? 1 }
            }]
        })
    },

    /**
     * 移除指定 key 的器官（定向，不走 UI 选择）
     */
    "removeOrganByKey": async (params: { organKey: string }) => {
        const organs = (nowPlayer as any).organs
        if (!Array.isArray(organs)) return
        const organ = organs.find((o: any) => o.key === params.organKey)
        if (!organ) {
            console.warn(`[removeOrganByKey] 找不到器官: ${params.organKey}`)
            return
        }
        await doEvent({
            key: "removeOrgan",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{ key: "removeOrgan", params: { organ } }]
        })
    },

    /**
     * 随机获得遗物
     */
    "gainRandomRelic": async (params?: { count?: number, rarity?: string }) => {
        const count = params?.count || 1
        const relicList = getLazyModule<any[]>('relicList')

        // 按稀有度筛选（如果指定）——若筛选空，退回全池并警告（用于内容未打 rarity 时兜底）
        let filtered = relicList
        if (params?.rarity) {
            const byRarity = relicList.filter((r: any) => r.rarity === params.rarity)
            if (byRarity.length > 0) {
                filtered = byRarity
            } else {
                newLog([`没有 ${params.rarity} 稀有度的遗物，退回随机全池`])
            }
        }
        if (filtered.length === 0) {
            newLog(["遗物池为空，无遗物可获得"])
            return
        }

        // 随机选择遗物
        const selected = randomChoices(filtered, count, "gainRandomRelic")

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
    "gainRandomPotion": async (params?: { count?: number, rarity?: string }) => {
        const count = params?.count || 1
        const potionList = getLazyModule<any[]>('potionList')

        // 按稀有度筛选（如果指定）——若筛选空，退回全池并警告（用于内容未打 rarity 时兜底）
        let filtered = potionList
        if (params?.rarity) {
            const byRarity = potionList.filter((p: any) => p.rarity === params.rarity)
            if (byRarity.length > 0) {
                filtered = byRarity
            } else {
                newLog([`没有 ${params.rarity} 稀有度的药水，退回随机全池`])
            }
        }
        if (filtered.length === 0) {
            newLog(["药水池为空，无药水可获得"])
            return
        }

        // 随机选择药水
        const selected = randomChoices(filtered, count, "gainRandomPotion")

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
    "gainRandomCard": async (params?: { count?: number, rarity?: string, tags?: string[] }) => {
        const count = params?.count || 1
        const cardList = getLazyModule<any[]>('cardList')

        // 根据稀有度筛选（如果指定）
        let filteredCards = cardList
        if (params?.rarity) {
            filteredCards = filteredCards.filter((c: any) => c.rarity === params.rarity)
        }
        // 根据标签筛选（如果指定，任一命中即可）
        if (params?.tags && params.tags.length > 0) {
            filteredCards = filteredCards.filter((c: any) =>
                (c.tags ?? []).some((t: string) => params!.tags!.includes(t))
            )
        }
        if (filteredCards.length === 0) {
            newLog(["没有符合条件的卡牌可获得"])
            return
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
     * 随机移除一张卡牌（无需玩家选择，带展示动画）
     * 用于像"废弃神龛"这种赌博式事件
     */
    "removeRandomCard": async (params?: { count?: number }) => {
        const count = params?.count || 1
        const cards = nowPlayer.getCardGroup()
        if (cards.length === 0) {
            newLog(["卡组中没有卡牌可移除"])
            return
        }

        const selected = randomChoices(cards, Math.min(count, cards.length), "removeRandomCard")

        for (const card of selected) {
            await showRandomCardShowcase(card, "remove")
            await doEvent({
                key: "removeCard",
                source: nowPlayer,
                medium: card,
                target: nowPlayer,
                effectUnits: [{
                    key: "removeCard",
                    params: { card }
                }]
            })
        }
    },

    /**
     * 随机复制一张卡牌（无需玩家选择，带展示动画）
     * 复制的卡牌会加入卡组
     */
    "duplicateRandomCard": async (params?: { count?: number }) => {
        const count = params?.count || 1
        const cards = nowPlayer.getCardGroup()
        if (cards.length === 0) {
            newLog(["卡组中没有卡牌可复制"])
            return
        }

        const selected = randomChoices(cards, Math.min(count, cards.length), "duplicateRandomCard")

        for (const card of selected) {
            await showRandomCardShowcase(card, "duplicate")
            await doEvent({
                key: "gainCard",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainCard",
                    params: { cardKey: card.key }
                }]
            })
        }
    },

    /**
     * 失去最大生命（固定值）
     */
    "loseMaxHealth": async (params: { amount: number }) => {
        await doEvent({
            key: "loseMaxHealth",
            source: nowPlayer,
            medium: nowPlayer,
            target: nowPlayer,
            effectUnits: [{
                key: "addMaxHealthAndHeal",
                params: { value: -Math.abs(params.amount) }
            }]
        })
    },

    /**
     * 随机失去一瓶药水
     */
    "loseRandomPotion": async () => {
        const potions = getPotionModifier(nowPlayer).getPotions()
        if (potions.length === 0) {
            newLog(["没有可失去的药水"])
            return
        }
        const chosen = randomChoice(potions, "loseRandomPotion")
        await doEvent({
            key: "losePotion",
            source: nowPlayer,
            medium: chosen,
            target: nowPlayer,
            effectUnits: [{
                key: "losePotion",
                params: { potionKey: chosen.key }
            }]
        })
    },

    /**
     * 失去所有药水
     */
    "loseAllPotions": async () => {
        const potions = [...getPotionModifier(nowPlayer).getPotions()]
        if (potions.length === 0) {
            newLog(["没有药水可失去"])
            return
        }
        for (const potion of potions) {
            await doEvent({
                key: "losePotion",
                source: nowPlayer,
                medium: potion,
                target: nowPlayer,
                effectUnits: [{
                    key: "losePotion",
                    params: { potionKey: potion.key }
                }]
            })
        }
    },

    /**
     * 随机失去一个已装器官（无玩家选择）
     * 用于"无常之神"等强制惩罚事件
     */
    "loseRandomOrgan": async () => {
        const organs = getOrganModifier(nowPlayer).getRemovableOrgans()
        if (organs.length === 0) {
            newLog(["没有可失去的器官"])
            return
        }
        const chosen = randomChoice(organs, "loseRandomOrgan")
        newLog(["神明夺走了你的", chosen])
        await doEvent({
            key: "removeOrgan",
            source: nowPlayer,
            medium: chosen,
            target: nowPlayer,
            effectUnits: [{
                key: "removeOrgan",
                params: { organ: chosen }
            }]
        })
    },

    /**
     * 无常之神：准备当前这一把的奖惩（及庄家先骰时的点数）。
     * 阶段规则见 eventList 的 event_god_of_chance，以及《事件实现场景手册》场景 11。
     */
    "godOfChance_prepare": async (params: { data: any }) => {
        const data = params.data
        const round = data.round ?? 1
        if (round < 1 || round > GOD_OF_CHANCE_MAX_ROUND) {
            throw new Error(`[godOfChance_prepare] 非法回合 ${round}，应在 1-6 之间`)
        }
        const idx = round - 1

        const sizeWeights = [
            [70, 25, 5],
            [60, 30, 10],
            [40, 40, 20],
            [25, 40, 35],
            [15, 35, 50],
            [5, 30, 65],
        ]
        const size = randomWeightedChoice(
            ["small", "medium", "large"] as const,
            sizeWeights[idx],
            `godOfChance_size_${round}`
        )

        const goldNow = getReserveModifier(nowPlayer).getReserve("gold")
        const materialNow = getReserveModifier(nowPlayer).getReserve("material")
        const potionCount = getPotionModifier(nowPlayer).getPotions().length
        const organCount = getOrganModifier(nowPlayer).getRemovableOrgans().length

        type Result = { label: string; tell: string; available: boolean; run: () => void | Promise<void> }
        const eff = eventEffectMap

        const smallPositive: Result[] = [
            { label: "10金币", tell: "你获得了10金币", available: true, run: () => eff["gainGold"]({ amount: 10 }) },
            { label: "5物质", tell: "你获得了5物质", available: true, run: () => eff["gainMaterial"]({ amount: 5 }) },
            { label: "回复3点生命", tell: "你回复了3点生命", available: true, run: () => eff["healHealth"]({ amount: 3 }) },
        ]
        const mediumPositive: Result[] = [
            { label: "30金币", tell: "你获得了30金币", available: true, run: () => eff["gainGold"]({ amount: 30 }) },
            { label: "15物质", tell: "你获得了15物质", available: true, run: () => eff["gainMaterial"]({ amount: 15 }) },
            { label: "回复20%当前生命", tell: "你回复了20%当前生命", available: true, run: async () => {
                const cur = Number(nowPlayer.current.health.value)
                const amount = Math.max(1, Math.floor(cur * 0.20))
                await eff["healHealth"]({ amount })
            } },
            { label: "5点最大生命", tell: "你获得了5点最大生命", available: true, run: () => eff["gainMaxHealth"]({ amount: 5 }) },
            { label: "一瓶普通药水", tell: "你获得了一瓶普通药水", available: true, run: () => eff["gainRandomPotion"]({ rarity: "common" }) },
        ]
        const largePositive: Result[] = [
            { label: "60金币", tell: "你获得了60金币", available: true, run: () => eff["gainGold"]({ amount: 60 }) },
            { label: "30物质", tell: "你获得了30物质", available: true, run: () => eff["gainMaterial"]({ amount: 30 }) },
            { label: "回复50%当前生命", tell: "你回复了50%当前生命", available: true, run: async () => {
                const cur = Number(nowPlayer.current.health.value)
                const amount = Math.max(1, Math.floor(cur * 0.50))
                await eff["healHealth"]({ amount })
            } },
            { label: "15点最大生命", tell: "你获得了15点最大生命", available: true, run: () => eff["gainMaxHealth"]({ amount: 15 }) },
            { label: "一瓶稀有药水", tell: "你获得了一瓶稀有药水", available: true, run: () => eff["gainRandomPotion"]({ rarity: "rare" }) },
            { label: "一件稀有遗物", tell: "你获得了一件稀有遗物", available: true, run: () => eff["gainRandomRelic"]({ rarity: "rare" }) },
            { label: "无常的祝福", tell: "你获得了下3场战斗每场开始+3力量和+3敏捷", available: true, run: () => eff["gainRelic"]({ relicKey: "relic_god_of_chance_blessing" }) },
        ]

        const smallNegative: Result[] = [
            { label: "失去10金币", tell: "你失去了10金币", available: goldNow >= 10, run: () => eff["loseGold"]({ amount: 10 }) },
            { label: "失去3点生命", tell: "你失去了3点生命", available: true, run: () => eff["loseHealth"]({ amount: 3 }) },
            { label: "失去5物质", tell: "你失去了5物质", available: materialNow >= 5, run: () => eff["loseMaterial"]({ amount: 5 }) },
        ]
        const mediumNegative: Result[] = [
            { label: "失去30金币", tell: "你失去了30金币", available: goldNow >= 30, run: () => eff["loseGold"]({ amount: 30 }) },
            { label: "失去10%当前生命", tell: "你失去了10%当前生命", available: true, run: async () => {
                const cur = Number(nowPlayer.current.health.value)
                const amount = Math.max(1, Math.floor(cur * 0.10))
                await eff["loseHealth"]({ amount })
            } },
            { label: "失去5点最大生命", tell: "你失去了5点最大生命", available: true, run: () => eff["loseMaxHealth"]({ amount: 5 }) },
            { label: "随机失去一瓶药水", tell: "你失去了一瓶药水", available: potionCount >= 1, run: () => eff["loseRandomPotion"]() },
            { label: "一张普通诅咒", tell: "你获得了一张普通诅咒", available: true, run: () => eff["gainRandomCard"]({ tags: ["curse"] }) },
        ]
        const largeNegative: Result[] = [
            { label: "失去60金币", tell: "你失去了60金币", available: goldNow >= 60, run: () => eff["loseGold"]({ amount: 60 }) },
            { label: "失去25%当前生命", tell: "你失去了25%当前生命", available: true, run: async () => {
                const cur = Number(nowPlayer.current.health.value)
                const amount = Math.max(1, Math.floor(cur * 0.25))
                await eff["loseHealth"]({ amount })
            } },
            { label: "失去15点最大生命", tell: "你失去了15点最大生命", available: true, run: () => eff["loseMaxHealth"]({ amount: 15 }) },
            { label: "失去一个器官", tell: "你失去了一个器官", available: organCount >= 1, run: () => eff["loseRandomOrgan"]() },
            { label: "一张强诅咒", tell: "你获得了一张强诅咒", available: true, run: () => eff["gainRandomCard"]({ tags: ["curse"] }) },
            { label: "失去所有药水", tell: "你失去了所有药水", available: potionCount >= 1, run: () => eff["loseAllPotions"]() },
        ]

        const positiveMap = { small: smallPositive, medium: mediumPositive, large: largePositive }
        const negativeMap = { small: smallNegative, medium: mediumNegative, large: largeNegative }

        let win: Result
        if (size === "large" && randomChance(0.10, `godOfChance_greed_${round}`)) {
            win = {
                label: "【贪】",
                tell: "你获得了【贪】",
                available: true,
                run: () => eff["gainCard"]({ cardKey: "card_greed" }),
            }
        } else {
            win = randomChoice(positiveMap[size], `godOfChance_win_${round}`)
        }

        const usableLose = negativeMap[size].filter(r => r.available)
        const losePool = usableLose.length > 0 ? usableLose : smallNegative.filter(r => r.available)
        if (losePool.length === 0) {
            throw new Error(`[godOfChance_prepare] round ${round} 负${size} 池中无可用候选`)
        }
        const lose = randomChoice(losePool, `godOfChance_lose_${round}`)

        data.winLabel = win.label
        data.winTell = win.tell
        data.winRun = win.run
        data.loseLabel = lose.label
        data.loseTell = lose.tell
        data.loseRun = lose.run
        data.houseRevealed = false
        data.playerRevealed = false
        data.playerFace = undefined
        data.busy = false

        if (godOfChanceIsHouseFirst(round)) {
            data.houseFace = eventEffectMap["godOfChance_rollHouse"]({ round })
        } else {
            data.houseFace = undefined
        }
    },

    "godOfChance_rollHouse": (params: { round: number }) => {
        const round = params.round
        const faces = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        const weights = [
            [18, 16, 14, 12, 10, 9, 7, 0, 0, 0],
            [14, 14, 13, 12, 11, 10, 8, 0, 0, 0],
            [10, 10, 11, 12, 12, 11, 10, 9, 8, 7],
            [7, 8, 9, 10, 11, 12, 12, 11, 10, 10],
            [5, 6, 7, 8, 10, 12, 13, 13, 13, 13],
            [3, 4, 5, 6, 8, 10, 12, 15, 17, 20],
        ]
        const idx = Math.max(0, Math.min(round, GOD_OF_CHANCE_MAX_ROUND) - 1)
        return randomWeightedChoice(faces, weights[idx], `godOfChance_house_${round}`)
    },

    "godOfChance_rollPlayer": (params: { round: number }) => {
        return randomInt(1, 10, `godOfChance_player_${params.round}`)
    },

    "godOfChance_apply": async (params: { data: any }) => {
        const data = params.data
        const playerFace = Number(data.playerFace)
        const houseFace = Number(data.houseFace)
        if (!Number.isFinite(playerFace) || !Number.isFinite(houseFace)) {
            throw new Error("[godOfChance_apply] 缺少双方点数")
        }
        const won = playerFace > houseFace
        const tie = playerFace === houseFace
        if (won) {
            await data.winRun()
            data.lastTell = data.winTell
        } else {
            await data.loseRun()
            data.lastTell = data.loseTell
        }
        data.lastPlayerFace = playerFace
        data.lastHouseFace = houseFace
        data.lastWon = won
        data.lastTie = tie
        data.resolved = true
        data.busy = true
        newLog([won ? `压过对面：${data.winLabel}` : `没能压过：${data.loseLabel}`])
    },

    /**
     * 打开宝箱（随机奖励）
     */
    "openChest": async () => {
        newLog(["打开宝箱..."])
        // 随机给予奖励
    },

    /**
     * 从指定遗物池中随机获得一个遗物
     * @param pool 遗物key数组，按权重组分组 [{ keys: string[], weight: number }]
     */
    "gainRelicFromPool": async (params: { pool: { keys: string[], weight: number }[] }) => {
        // 按权重选择组
        const totalWeight = params.pool.reduce((sum, g) => sum + g.weight, 0)
        let roll = Math.random() * totalWeight
        let selectedGroup = params.pool[0]
        for (const group of params.pool) {
            roll -= group.weight
            if (roll <= 0) {
                selectedGroup = group
                break
            }
        }
        // 从组内随机选一个
        const selected = randomChoices(selectedGroup.keys, 1, "gainRelicFromPool")
        const relicKey = selected[0]
        if (relicKey) {
            await doEvent({
                key: "gainRelic",
                source: nowPlayer,
                medium: nowPlayer,
                target: nowPlayer,
                effectUnits: [{
                    key: "gainRelic",
                    params: { relicKey }
                }]
            })
        }
    },

    /**
     * 胚胎发育：接生器官（写入 evolutionRounds 后装到玩家）
     * 直接 createOrgan → setOriginalBaseValue 写入进化轮次 → acquireOrgan，
     * 让器官从出生起就带上正确的 evolutionRounds（reaction 里读的都是 status 值）。
     */
    "deliverEmbryo": async (params: { stage: number, evolutionRounds: number }) => {
        const stage = Math.max(1, Math.min(5, Number(params.stage) || 1))
        const rounds = Math.max(0, Number(params.evolutionRounds) || 0)
        const organKey = `organ_embryo_stage${stage}`
        const organListModule = getLazyModule<any[]>('organList')
        const organData = organListModule.find((o: any) => o.key === organKey)
        if (!organData) {
            console.error(`[deliverEmbryo] 未找到器官: ${organKey}`)
            return
        }
        const organ = await createOrgan(organData)
        if (rounds > 0) {
            organ.status["evolutionRounds"]?.setOriginalBaseValue(rounds)
        }
        await getOrganModifier(nowPlayer).acquireOrgan(organ, nowPlayer)
        newLog([nowPlayer, "接生了", organ, rounds > 0 ? `（已进化 ${rounds} 轮）` : ""])
    },

    /**
     * 胚胎发育：抽一张代价，返回给 costPreview 展示；玩家接受后走 applyEmbryoCost 结算。
     * heavy=true 走阶段 5 进化的重代价小池（2 项均分）；
     * heavy=false 走推进代价常规池（5 类均分，类内均分）。
     * 资源不足的项（无金/无药水/无器官）从池中剔除，剔空整类的类也剔掉。
     */
    "drawEmbryoCost": async (params: { heavy: boolean }): Promise<{ label: string, run: () => Promise<void> } | null> => {
        type Cost = { label: string, run: () => Promise<void> }
        const eff = eventEffectMap

        if (params.heavy) {
            const organCount = getOrganModifier(nowPlayer).getRemovableOrgans().length
            const pool: Cost[] = []
            if (organCount >= 1) {
                pool.push({ label: "失去 1 个已装器官", run: async () => { await eff["loseRandomOrgan"]() } })
            }
            pool.push({ label: "失去 30% 最大生命", run: async () => { await eff["loseMaxHealthPercent"]({ percent: 30 }) } })
            return randomChoice(pool, "embryoCost:heavy")
        }

        const goldNow = getReserveModifier(nowPlayer).getReserve("gold")
        const potionCount = getPotionModifier(nowPlayer).getPotions().length

        const categories: Cost[][] = []

        categories.push([
            { label: "失去 15% 当前生命", run: async () => {
                const cur = Number(nowPlayer.current.health.value)
                const amount = Math.max(1, Math.floor(cur * 0.15))
                await eff["loseHealth"]({ amount })
            }},
            { label: "失去 10 生命", run: async () => { await eff["loseHealth"]({ amount: 10 }) } },
        ])

        categories.push([
            { label: "失去 5 最大生命", run: async () => { await eff["loseMaxHealth"]({ amount: 5 }) } },
            { label: "失去 8 最大生命", run: async () => { await eff["loseMaxHealth"]({ amount: 8 }) } },
        ])

        const goldCat: Cost[] = []
        if (goldNow >= 50) goldCat.push({ label: "失去 50 金", run: async () => { await eff["loseGold"]({ amount: 50 }) } })
        if (goldNow >= 100) goldCat.push({ label: "失去 100 金", run: async () => { await eff["loseGold"]({ amount: 100 }) } })
        if (goldCat.length > 0) categories.push(goldCat)

        categories.push([
            { label: "获得 1 张诅咒", run: async () => { await eff["gainRandomCard"]({ tags: ["curse"] }) } },
            { label: "牌组随机移除 1 张", run: async () => { await eff["removeRandomCard"]({ count: 1 }) } },
        ])

        if (potionCount >= 1) {
            categories.push([
                { label: "随机失去 1 瓶药水", run: async () => { await eff["loseRandomPotion"]() } },
            ])
        }

        const cat = randomChoice(categories, "embryoCost:cat")
        return randomChoice(cat, "embryoCost:item")
    },

    /**
     * 胚胎发育：结算代价（跑 drawEmbryoCost 返回对象里的 run）
     */
    "applyEmbryoCost": async (params: { cost: { label: string, run: () => Promise<void> } | null }) => {
        if (!params.cost) return
        await params.cost.run()
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
export async function executeEventEffect(effectKey: string, params?: any): Promise<any> {
    const effectFunc = eventEffectMap[effectKey]
    if (!effectFunc) {
        console.error(`[EventEffect] 未找到事件效果: ${effectKey}`)
        return
    }

    return await effectFunc(params)
}

/**
 * 注册事件效果。Mod 和主游戏同一张表；key 冲突会覆盖并警告。
 */
export function registerEventEffect(key: string, effect: EventEffectFunc): void {
    if (eventEffectMap[key]) {
        console.warn(`[EventEffect] 覆盖已有事件效果: ${key}`)
    }
    eventEffectMap[key] = effect
}

export function registerEventEffects(effects: Record<string, EventEffectFunc>): void {
    for (const [key, effect] of Object.entries(effects)) {
        registerEventEffect(key, effect)
    }
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
