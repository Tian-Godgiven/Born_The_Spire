/**
 * 事件配置列表
 * 定义游戏中的所有事件
 */

import { markRaw } from "vue"
import type { EventMap, EventOptionMap } from "@/core/types/EventMapData"
import { eventEffectMap } from "./eventEffectMap"
import GodOfChanceTable from "@/ui/components/interaction/GodOfChanceTable.vue"
import {
    GOD_OF_CHANCE_MAX_ROUND,
    godOfChanceIsHouseFirst,
    godOfChanceTableText,
} from "./godOfChance"
import { OrganTags } from "@/static/list/target/organTags"
import { nowPlayer } from "@/core/objects/game/run"
import { randomChoice, randomChance, randomInt } from "@/core/hooks/random"
import { getItemList, filterItems } from "@/core/hooks/draw"
import { getCurrentValue } from "@/core/objects/system/Current/current"
import { getCardModifier } from "@/core/objects/system/modifier/CardModifier"
import { getOrganModifier } from "@/core/objects/system/modifier/OrganModifier"
import { isOrgan } from "@/core/utils/typeGuards"
import { showTransplantSelect } from "@/ui/hooks/interaction/transplantSelect"
import { doEvent } from "@/core/objects/system/ActionEvent"
import { upgradeCard } from "@/core/effects/card/cardUpgrade"
import type { Organ } from "@/core/objects/target/Organ"
import type { Card } from "@/core/objects/item/Subclass/Card"

function nonLethalHalfMaxHealth(): number {
    const maxHealth = Number(nowPlayer.status["max-health"]?.value ?? 0)
    const hp = getCurrentValue(nowPlayer, "health", 0)
    return Math.min(Math.floor(maxHealth * 0.5), Math.max(0, hp - 1))
}

/**
 * 收藏家 NPC 点名：按稀有度优先（rare > uncommon > common），同层随机。
 * 只此一处使用，内嵌于本文件，不抽公共 helper。
 */
function pickCollectorTarget(organs: any[]): any {
    const buckets: Record<string, any[]> = { rare: [], uncommon: [], common: [] }
    for (const o of organs) {
        const r = o.rarity ?? "common"
        if (buckets[r]) buckets[r].push(o)
        else buckets.common.push(o)
    }
    const bucket = buckets.rare.length ? buckets.rare
                : buckets.uncommon.length ? buckets.uncommon
                : buckets.common
    return randomChoice(bucket, "collectorPick")
}

function pickCollectorGift(excludeKey?: string): { key: string, label: string } | null {
    const pool = filterItems(getItemList("organ"), {
        pool: "common",
        rarity: ["common", "uncommon"],
        exclude: excludeKey ? [excludeKey] : [],
    }).filter((o: any) => !(o.tags ?? []).includes(OrganTags.STARTER))
    if (pool.length === 0) return null
    const picked = randomChoice(pool, "collectorGift")
    return { key: picked.key, label: picked.label }
}

function collectorRollPay(data: any, gift: boolean): void {
    data.gold = randomInt(100, 120, "collectorGold")
    data.giftOrgan = gift ? pickCollectorGift(data.pickedOrgan?.key) : null
}

async function lakeOfferCard(data: any): Promise<boolean> {
    const { showCardChoice } = await import("@/ui/hooks/interaction/cardChoice")
    const selected = await showCardChoice({
        title: "投入湖中",
        description: "选择一张卡牌投入湖中",
        cards: nowPlayer.getCardGroup(),
        minSelect: 1,
        maxSelect: 1,
        cancelable: false
    })
    const card = selected[0]
    if (!card) return false
    data.itemType = "card"
    data.cardKey = card.key
    data.cardLevel = card.level ?? 0
    await doEvent({
        key: "removeCard",
        source: nowPlayer,
        medium: card,
        target: nowPlayer,
        effectUnits: [{ key: "removeCard", params: { card } }]
    })
    return true
}

async function lakeOfferOrgan(data: any): Promise<boolean> {
    const organs = getOrganModifier(nowPlayer).getRemovableOrgans()
    if (organs.length === 0) return false
    const { showOrganChoice } = await import("@/ui/hooks/interaction/organChoice")
    const result = await showOrganChoice({
        title: "投入湖中",
        description: "选择一个器官投入湖中",
        organKeys: organs.map(o => o.key),
        minSelect: 1,
        maxSelect: 1,
        cancelable: false
    })
    const organKey = result.selectedKeys[0]
    const organ = organs.find(o => o.key === organKey)
    if (!organ) return false
    data.itemType = "organ"
    data.organKey = organ.key
    data.organLevel = organ.level ?? 1
    await doEvent({
        key: "removeOrgan",
        source: nowPlayer,
        medium: organ,
        target: nowPlayer,
        effectUnits: [{ key: "removeOrgan", params: { organ } }]
    })
    return true
}

const GOD_OF_CHANCE_TABLE = markRaw(GodOfChanceTable)

async function godOfChanceEnterTable(data: any) {
    if (data.resolved) {
        data.round = (data.round ?? 1) + 1
        data.resolved = false
        data.houseRevealed = false
        data.playerRevealed = false
        data.playerFace = undefined
        data.houseFace = undefined
        data.busy = false
    }
    if (!data.round) data.round = 1
    await eventEffectMap["godOfChance_prepare"]({ data })
    data.dealId = (data.dealId ?? 0) + 1
}

function godOfChanceCanStop(data: any): boolean {
    if (data.busy || data.resolved) return false
    const round = data.round ?? 1
    if (godOfChanceIsHouseFirst(round) && !data.houseRevealed) return false
    return true
}

function godOfChanceCanLeave(data: any): boolean {
    return !data.busy && !data.resolved
}

async function lakeReturnOffered(data: any) {
    if (data.itemType === "card" && data.cardKey) {
        await eventEffectMap.gainCard({ cardKey: data.cardKey })
        const cards = nowPlayer.getCardGroup().filter((c: Card) => c.key === data.cardKey)
        const card = cards[cards.length - 1]
        if (!card) return
        const targetLevel = Number(data.cardLevel) || 0
        while (card.level < targetLevel) {
            if (!upgradeCard(card)) break
        }
        return
    }
    if (data.itemType === "organ" && data.organKey) {
        await eventEffectMap.gainOrgan({ organKey: data.organKey })
        const organs = getOrganModifier(nowPlayer).getOrgans()
        const organ = [...organs].reverse().find(o => o.key === data.organKey)
        if (!organ) return
        const targetLevel = Number(data.organLevel) || 1
        const organModifier = getOrganModifier(nowPlayer)
        while (organ.level < targetLevel) {
            if (!await organModifier.upgradeOrgan(organ, { skipCost: true })) break
        }
    }
}

const EMBRYO_STAGE_NAMES = ["合子", "桑葚胚", "囊胚", "原肠胚", "神经胚"] as const

function embryoStage(data: any): number {
    return data.stage ?? 1
}

function embryoOrganKey(data: any): string {
    return `organ_embryo_stage${embryoStage(data)}`
}

function embryoStageName(data: any): string {
    return EMBRYO_STAGE_NAMES[embryoStage(data) - 1] ?? "合子"
}

async function embryoEnsureCost(data: any): Promise<void> {
    if (data.pendingCost) return
    data.pendingCost = await eventEffectMap["drawEmbryoCost"]({
        heavy: embryoStage(data) >= 5
    })
}

function embryoCostDescription(data: any): string {
    const label = data.pendingCost?.label
    return label
        ? `它需要一些……营养……/br/${label}`
        : "它需要一些……营养……"
}

function embryoBirthOption(stayScene: string): EventOptionMap {
    return {
        key: "deliver",
        title: "接生",
        description: "获得",
        previewOrganKey: (data) => embryoOrganKey(data),
        customCallback: async (data) => {
            const ok = await eventEffectMap["deliverEmbryo"]({
                stage: embryoStage(data),
                evolutionRounds: data.evolutionRounds ?? 0
            })
            if (!ok) return stayScene
        }
    }
}

function embryoDevelopOption(): EventOptionMap {
    return {
        key: "develop",
        title: "发育",
        description: embryoCostDescription,
        ifShow: (data) => embryoStage(data) < 5,
        customCallback: async (data) => {
            await eventEffectMap["applyEmbryoCost"]({ cost: data.pendingCost })
            data.pendingCost = null
            data.stage = embryoStage(data) + 1
        },
        nextScene: "jar"
    }
}

function embryoCycleOption(): EventOptionMap {
    return {
        key: "cycle",
        title: "轮回",
        description: embryoCostDescription,
        ifShow: (data) => embryoStage(data) === 5,
        customCallback: async (data) => {
            await eventEffectMap["applyEmbryoCost"]({ cost: data.pendingCost })
            data.pendingCost = null
            data.evolutionRounds = (data.evolutionRounds ?? 0) + 1
            data.stage = 1
        },
        nextScene: "cycle"
    }
}

/**
 * 事件配置列表
 * 注意：游戏开始的苏生事件已移至 initList.ts，不再作为普通事件
 */
export const eventList: EventMap[] = [
    // 神秘商人
    {
        key: "event_mysterious_merchant",
        title: "神秘商人",
        description: "你遇到了一个衣衫褴褛的流浪汉，他却说他曾经是个商人，如果你能给他一些金币……",
        icon: "🧙",
        scenes: [
            {
                key: "offer",
                title: "神秘商人",
                description: "你遇到了一个衣衫褴褛的流浪汉，他却说他曾经是个商人，如果你能给他一些金币……",
                options: [
                    {
                        title: "给他20金币",
                        description: "获得一瓶随机药水",
                        icon: "🧪",
                        ifAble: "$owner.reserve(gold) >= 20",
                        nextScene: "result_potion",
                        effects: [
                            { key: "loseGold", params: { amount: 20 } },
                            { key: "gainRandomPotion", params: { count: 1 } }
                        ]
                    },
                    {
                        title: "给他60金币",
                        description: "获得一个随机遗物",
                        icon: "💎",
                        ifAble: "$owner.reserve(gold) >= 60",
                        nextScene: "result_relic",
                        effects: [
                            { key: "loseGold", params: { amount: 60 } },
                            { key: "gainRandomRelic", params: { count: 1 } }
                        ]
                    },
                    {
                        title: "无视他",
                        description: "离开",
                        icon: "🚪",
                        openMap: true,
                        effects: [{ key: "nothing" }]
                    }
                ]
            },
            {
                key: "result_potion",
                title: "神秘商人",
                description: "你吐出了一些金币，他欣喜若狂地捧了起来，随后鬼鬼祟祟地从一个脏污的布料里拿出一瓶药水交给你/br/\"又一笔买卖......嚯嚯嚯！有得赚！\"",
                options: [
                    {
                        title: "离开",
                        description: "离开",
                        icon: "🚪"
                    }
                ]
            },
            {
                key: "result_relic",
                title: "神秘商人",
                description: "你吐出了许多金币，他欣喜若狂地捧了起来，随后鬼鬼祟祟地从一个脏污的布料里拿出一个遗物交给你/br/\"又一笔买卖......嚯嚯嚯！有得赚！\"",
                options: [
                    {
                        title: "离开",
                        description: "离开",
                        icon: "🚪"
                    }
                ]
            }
        ]
    },

    // 两个宝箱
    {
        key: "event_treasure_chest",
        title: "两个宝箱",
        description: "一座荒废的垃圾堆里赫然摆着两个一大一小的宝箱，大的那个宝箱上似乎沾着血迹……",
        icon: "📦",
        scenes: [
            {
                key: "offer",
                title: "两个宝箱",
                description: "一座荒废的垃圾堆里赫然摆着两个一大一小的宝箱，大的那个宝箱上似乎沾着血迹……",
                options: [
                    {
                        title: "打开小宝箱",
                        description: "获得一些奖励",
                        icon: "📦",
                        nextScene: "result_small",
                        saveData: (data) => {
                            data.gold = randomInt(30, 40, "event_treasure_small_gold")
                        },
                        customCallback: async (data) => {
                            await eventEffectMap.gainGold({ amount: data.gold })
                        }
                    },
                    {
                        title: "打开大宝箱",
                        description: "获得更多奖励，但代价是……？",
                        icon: "🩸",
                        nextScene: "result_big",
                        saveData: (data) => {
                            data.gold = randomInt(50, 80, "event_treasure_big_gold")
                            data.damage = nonLethalHalfMaxHealth()
                        },
                        customCallback: async (data) => {
                            if (data.damage > 0) {
                                await eventEffectMap.loseHealth({ amount: data.damage })
                            }
                            await eventEffectMap.gainGold({ amount: data.gold })
                            await eventEffectMap.gainRandomRelic({ count: 1, rarity: "common" })
                        }
                    }
                ]
            },
            {
                key: "result_small",
                title: "两个宝箱",
                description: (data) => `小箱子里有${data.gold}金币，或许大宝箱里会有更多……但垃圾堆骤然坍塌，你没有机会知道了。`,
                options: [
                    { title: "离开", description: "离开", icon: "🚪" }
                ]
            },
            {
                key: "result_big",
                title: "两个宝箱",
                description: (data) => `大箱子里有${data.gold}金币，还有一件遗物！/br/但就在你将其取出时，箱子猛地合上狠狠地咬了你一口，造成${data.damage}点伤害！/br/所幸你将战利品带了出来，至于小箱子……你可不打算再冒一次风险……`,
                options: [
                    { title: "离开", description: "离开", icon: "🚪" }
                ]
            }
        ]
    },

    // 清澈泉水
    {
        key: "event_healing_spring",
        title: "清澈泉水",
        description: "你在一片狼藉中发现了一处明透的泉水",
        icon: "💧",
        scenes: [
            {
                key: "offer",
                title: "清澈泉水",
                description: "你在一片狼藉中发现了一处明透的泉水",
                options: [
                    {
                        title: "吸收",
                        description: "恢复50%最大生命",
                        icon: "🍶",
                        nextScene: "result_absorb",
                        saveData: (data) => {
                            const maxHealth = Number(nowPlayer.status["max-health"]?.value ?? 0)
                            const hp = getCurrentValue(nowPlayer, "health", 0)
                            data.heal = Math.min(
                                Math.floor(maxHealth * 0.5),
                                Math.max(0, maxHealth - hp)
                            )
                        },
                        customCallback: async (data) => {
                            if (data.heal > 0) {
                                await eventEffectMap.healHealth({ amount: data.heal })
                            }
                        }
                    },
                    {
                        title: "浸泡",
                        description: "从你的牌组中选择一张卡牌将其移除",
                        icon: "✨",
                        ifAble: "$owner.cardCount() >= 1",
                        nextScene: "result_soak",
                        effects: [
                            { key: "removeCard", params: { count: 1, minCount: 1 } }
                        ]
                    }
                ]
            },
            {
                key: "result_absorb",
                title: "清澈泉水",
                description: "洁净的泉水修复了你的存在，你感到更加完整……",
                options: [
                    { title: "离开", description: "离开", icon: "🚪" }
                ]
            },
            {
                key: "result_soak",
                title: "清澈泉水",
                description: "浸泡在透明的池水中，你感到一些多余的存在从你身上被稀释而出……",
                options: [
                    { title: "离开", description: "离开", icon: "🚪" }
                ]
            }
        ]
    },

    // 示例事件4：湖面精灵（多幕事件示例）
    {
        key: "event_lake_spirit",
        title: "湖面精灵",
        description: "你来到了一座平静的湖面...",
        icon: "🌊",
        scenes: [
            {
                key: "scene1",
                title: "平静的湖面",
                description: "一座平静的湖面倒映着天空，湖中央似乎有什么东西在闪烁...",
                options: [
                    {
                        title: "丢入一张卡牌",
                        description: "将一张卡牌投入湖中",
                        icon: "🃏",
                        ifAble: "$owner.cardCount() >= 1",
                        nextScene: "scene2",
                        customCallback: async (data) => {
                            if (!await lakeOfferCard(data)) return "scene1"
                        }
                    },
                    {
                        title: "丢入一个器官",
                        description: "将一个器官投入湖中",
                        icon: "🫀",
                        ifAble: "$owner.removableOrganCount() >= 1",
                        nextScene: "scene2",
                        customCallback: async (data) => {
                            if (!await lakeOfferOrgan(data)) return "scene1"
                        }
                    },
                    {
                        title: "离开",
                        description: "什么也不做",
                        icon: "🚪",
                        effects: [{ key: "nothing" }]
                    }
                ]
            },
            {
                key: "scene2",
                title: "透明的幻影",
                description: "湖面泛起涟漪，一个透明的幻影浮现出来，手中拿着两样东西...",
                options: [
                    {
                        key: "honest_card",
                        title: "是卡牌",
                        description: "诚实地承认丢入的是卡牌",
                        icon: "🃏",
                        ifShow: (data) => data.itemType === 'card',
                        nextScene: "scene3_honest",
                        saveData: (data) => { data.honest = true }
                    },
                    {
                        key: "lie_card",
                        title: "是器官",
                        description: "说谎称丢入的是器官",
                        icon: "🫀",
                        ifShow: (data) => data.itemType === 'card',
                        nextScene: "scene3_lie",
                        saveData: (data) => { data.honest = false }
                    },
                    {
                        key: "honest_organ",
                        title: "是器官",
                        description: "诚实地承认丢入的是器官",
                        icon: "🫀",
                        ifShow: (data) => data.itemType === 'organ',
                        nextScene: "scene3_honest",
                        saveData: (data) => { data.honest = true }
                    },
                    {
                        key: "lie_organ",
                        title: "是卡牌",
                        description: "说谎称丢入的是卡牌",
                        icon: "🃏",
                        ifShow: (data) => data.itemType === 'organ',
                        nextScene: "scene3_lie",
                        saveData: (data) => { data.honest = false }
                    }
                ]
            },
            {
                key: "scene3_honest",
                title: "诚实的奖励",
                description: "精灵微笑着点了点头：'你很诚实，这是你应得的奖励。'",
                options: [
                    {
                        title: "接受奖励",
                        description: "取回原本的物品，获得200物质",
                        icon: "✨",
                        effects: [
                            { key: "gainMaterial", params: { amount: 200 } }
                        ],
                        customCallback: async (data) => {
                            await lakeReturnOffered(data)
                        }
                    }
                ]
            },
            {
                key: "scene3_lie",
                title: "说谎的惩罚",
                description: "精灵的表情变得严肃：'你说谎了，接受惩罚吧。'",
                options: [
                    {
                        title: "接受惩罚",
                        description: "失去这个物品，受到10点伤害",
                        icon: "💀",
                        effects: [
                            { key: "loseHealth", params: { amount: 10 } }
                        ]
                    }
                ]
            }
        ]
    },

    // 无常之神：十面骰对赌，幕级整页组件
    {
        key: "event_god_of_chance",
        title: "无常之神",
        description: "空无一物的废墟中央，两枚骰子在不休止地旋转……",
        icon: "🎲",
        scenes: [
            {
                key: "approach",
                title: "无常之神",
                description: "空无一物的废墟中央，两枚骰子在不休止地旋转……",
                options: [
                    {
                        key: "approach",
                        title: "接近",
                        icon: "🎲",
                        saveData: (data) => { data.round = 1 },
                        nextScene: "table"
                    },
                    {
                        key: "walk_away",
                        title: "转身离开",
                        icon: "🚪"
                    }
                ]
            },
            {
                key: "table",
                title: "无常之神",
                description: (data) => godOfChanceTableText(data),
                component: GOD_OF_CHANCE_TABLE,
                onEnter: godOfChanceEnterTable,
                options: [
                    {
                        key: "roll_continue",
                        title: "停下骰子",
                        icon: "✋",
                        ifShow: (data) => (data.round ?? 1) < GOD_OF_CHANCE_MAX_ROUND,
                        ifAble: godOfChanceCanStop,
                        effects: [{ key: "godOfChance_apply" }],
                        nextScene: "table"
                    },
                    {
                        key: "roll_final",
                        title: "停下骰子",
                        icon: "✋",
                        ifShow: (data) => (data.round ?? 1) === GOD_OF_CHANCE_MAX_ROUND,
                        ifAble: godOfChanceCanStop,
                        effects: [{ key: "godOfChance_apply" }],
                        nextScene: "finale"
                    },
                    {
                        key: "leave_early",
                        title: "转身离开",
                        icon: "🚪",
                        ifShow: (data) => (data.round ?? 1) < 4,
                        ifAble: godOfChanceCanLeave
                    },
                    {
                        key: "leave_curse",
                        title: "转身离开",
                        description: "你会带上一张诅咒。",
                        icon: "🚪",
                        ifShow: (data) => (data.round ?? 1) >= 4,
                        ifAble: godOfChanceCanLeave,
                        afterEffects: [
                            { key: "gainRandomCard", params: { tags: ["curse"] } }
                        ],
                        nextScene: "leave_curse"
                    }
                ]
            },
            {
                key: "finale",
                title: "无常之神",
                description: "骰子继续旋转，但你已经无法让它停下了。",
                options: [{
                    key: "leave",
                    title: "转身离开",
                    icon: "🚪"
                }]
            },
            {
                key: "leave_curse",
                title: "无常之神",
                description: "你没有再伸手。转身时，有什么东西贴上了后背——你获得了一张诅咒。",
                options: [{
                    key: "leave",
                    title: "转身离开",
                    icon: "🚪"
                }]
            }
        ]
    },

    // 蠕动胚胎：起始幕接生/发育；发育后直接中间幕；第五阶段发育换成轮回
    {
        key: "event_embryogenesis",
        title: "蠕动胚胎",
        description: "在垃圾堆中，一个散发着荧光的厚玻璃罐内，小小的生命正在无休止地孕育",
        icon: "🥚",
        onEnter: (data) => {
            if (!data.stage) data.stage = 1
        },
        scenes: [
            {
                key: "start",
                title: "蠕动胚胎",
                description: "在垃圾堆中，一个散发着荧光的厚玻璃罐内，小小的生命正在无休止地孕育",
                onEnter: embryoEnsureCost,
                options: [
                    embryoBirthOption("start"),
                    embryoDevelopOption(),
                    embryoCycleOption(),
                ]
            },
            {
                key: "jar",
                title: "蠕动胚胎",
                description: (data) => {
                    const name = embryoStageName(data)
                    const rounds = data.evolutionRounds ?? 0
                    const roundLine = rounds > 0 ? `/br/它已经轮回过 ${rounds} 次。` : ""
                    return `罐子里已经是【${name}】了。${roundLine}`
                },
                onEnter: embryoEnsureCost,
                options: [
                    embryoBirthOption("jar"),
                    embryoDevelopOption(),
                    embryoCycleOption(),
                ]
            },
            {
                key: "cycle",
                title: "蠕动胚胎",
                description: "它把自己拆开，又缩回最初的那一点光。",
                options: [
                    {
                        key: "continue",
                        title: "……",
                        nextScene: "jar"
                    }
                ]
            }
        ]
    },

    // 废弃神龛：牌库单发赌博（无离开选项，二选一都必须承担后果）
    {
        key: "event_abandoned_shrine",
        title: "废弃神龛",
        description: "斜倚的石壁间藏着一座早被遗忘的神龛。神像面目模糊，供台上残留着几缕熄灭的香灰——它似乎仍在等待着什么。",
        icon: "⛩️",
        options: [
            {
                title: "祈祷",
                description: "你合十低语，一段不知归属的旋律在耳边回响。牌库中随机一张卡将被神灵取走。",
                icon: "🙏",
                effects: [
                    { key: "removeRandomCard", params: { count: 1 } }
                ]
            },
            {
                title: "亵渎",
                description: "你将手按上神像冰凉的额头。一阵刺骨的寒意涌上，牌库中随机一张卡被诡异地复刻。",
                icon: "🩸",
                effects: [
                    { key: "duplicateRandomCard", params: { count: 1 } }
                ]
            }
        ]
    },

    // 收藏家：点名可移除器官，卖 100～120 金；讨价还价成功再附赠普通/罕见通用器官
    {
        key: "event_collector",
        title: "收藏家",
        description: "你遇到一个衣衫褴褛的流浪汉，他一看到你就兴奋起来。他自称是收藏家。",
        icon: "🎩",
        onEnter: async (data) => {
            const organs = getOrganModifier(nowPlayer).getRemovableOrgans()
            if (organs.length === 0) return
            const picked = pickCollectorTarget(organs)
            data.pickedOrgan = { key: picked.key, label: picked.label, rarity: picked.rarity }
        },
        scenes: [
            {
                key: "main",
                title: "收藏家",
                description: (data) => data.pickedOrgan
                    ? `你遇到一个衣衫褴褛的流浪汉，他一看到你就兴奋起来。/br/他自称是收藏家，希望能从你身上采集一些有价值的样本……例如【${data.pickedOrgan.label}】/br/报酬自然是不会少。`
                    : "你遇到一个衣衫褴褛的流浪汉，他一看到你就兴奋起来。/br/他自称是收藏家，上下打量了你一番，却微微皱起眉：「……你身上似乎没什么值得我出手的。」",
                options: [
                    {
                        key: "let_him_pick",
                        title: "给他",
                        description: "失去器官",
                        previewOrganKey: (data) => data.pickedOrgan?.key,
                        previewOrganAfter: "，获得金币",
                        ifShow: (data) => !!data.pickedOrgan,
                        ifAble: "$owner.removableOrganCount() >= 1",
                        customCallback: async (data) => {
                            if (!data.pickedOrgan) return
                            collectorRollPay(data, false)
                        },
                        afterEffects: [{ key: "collectorSettle" }],
                        nextScene: "sold"
                    },
                    {
                        key: "haggle",
                        title: "讨价还价",
                        ifShow: (data) => !!data.pickedOrgan,
                        ifAble: "$owner.removableOrganCount() >= 1",
                        customCallback: async (data) => {
                            if (!data.pickedOrgan) return "haggle_lose"
                            if (!randomChance(0.5, "collectorHaggle")) return "haggle_lose"
                            collectorRollPay(data, true)
                            return "haggle_win"
                        }
                    },
                    {
                        key: "refuse",
                        title: "无视它",
                        nextScene: "ignored"
                    }
                ]
            },
            {
                key: "sold",
                title: "收藏家",
                description: (data) => {
                    const name = data.pickedOrgan?.label ?? "器官"
                    return `他兴高采烈地将【${name}】隆重地装进一个玻璃罐里，就这样死死地盯着它看：“咦嘻嘻嘻嘻……”/br/他怪异的声音在你身后回荡`
                },
                options: [{
                    key: "leave",
                    title: "离开"
                }]
            },
            {
                key: "haggle_win",
                title: "收藏家",
                description: "他十分不舍地拿出另一件「藏品」和你做交换，当然报酬一分也没少，看来他确实很想要来自你身上的东西……",
                options: [{
                    key: "claim",
                    title: "赚到了",
                    description: (data) => {
                        const gold = data.gold ?? 0
                        return data.giftOrgan
                            ? `获得了${gold}金币，获得了`
                            : `获得了${gold}金币`
                    },
                    previewOrganKey: (data) => data.giftOrgan?.key,
                    afterEffects: [{ key: "collectorSettle" }]
                }]
            },
            {
                key: "haggle_lose",
                title: "收藏家",
                description: "他拿不出更多报酬，整个人看起来沮丧极了，但这和你无关。",
                options: [{
                    key: "leave",
                    title: "离开"
                }]
            },
            {
                key: "ignored",
                title: "收藏家",
                description: "它看起来沮丧极了，但这和你无关。",
                options: [{
                    key: "leave",
                    title: "离开"
                }]
            }
        ]
    },

    // 移植手术：多幕循环，卡牌归属在器官间转移
    // 数据草稿 2026-07-29：等实现前置解决后才能跑通（见任务列表.md）
    //   1) 两阶段"选卡 + 选目标器官"UI 组件（选卡时按器官分组显示）
    //   2) ContentModifier "改归属"通路（把卡从器官 A 移到器官 B）
    //   ✅ ifAble 语法：organCount() / organsWithCardsCount() 已加
    {
        key: "event_transplant_surgery",
        title: "移植手术",
        description: "一个自称「外科医师」的怪人邀请你上手术台。他戴着沾血的口罩，桌上摆着几件生锈的工具。",
        icon: "🔪",
        scenes: [
            {
                key: "main",
                title: "移植手术",
                description: "医生看着你，等待你的决定。",
                options: [
                    {
                        key: "get_on_table",
                        title: "上手术台",
                        description: "每次手术失当前 HP 10%，将一张已装器官上的卡改到另一个已装器官。",
                        icon: "🩺",
                        ifAble: "$owner.organCount() >= 2 && $owner.organsWithCardsCount() >= 1",
                        nextScene: "operation"
                    },
                    {
                        key: "leave_main",
                        title: "离开",
                        description: "拒绝医生的邀请。",
                        icon: "🚪"
                    }
                ]
            },
            {
                key: "operation",
                title: "手术台",
                description: "医生示意你选择：从哪个器官取一张卡，移到哪个器官。",
                options: [
                    {
                        key: "do_surgery",
                        title: "开始手术（失当前 HP 10%）",
                        description: "选择一张卡和目标器官，卡归属转移到目标器官（效果不变）。",
                        icon: "🔪",
                        effects: [
                            { key: "loseHealthPercent", params: { percent: 10 } }
                        ],
                        customCallback: async () => {
                            const cardMod = getCardModifier(nowPlayer)
                            const organMod = getOrganModifier(nowPlayer)

                            const allOrgans = organMod.getOrgans()
                            const groups: { organ: Organ, cards: Card[] }[] = []
                            for (const [source, cards] of cardMod.getAllSourcedCards()) {
                                if (isOrgan(source) && cards.length > 0) {
                                    groups.push({ organ: source as Organ, cards })
                                }
                            }

                            if (groups.length === 0 || allOrgans.length < 2) return

                            const { card, targetOrgan } = await showTransplantSelect({ groups, allOrgans })
                            cardMod.transferCardOwnership(card, targetOrgan)
                        },
                        nextScene: "operation" // 回到本场景，可继续手术或离开
                    },
                    {
                        key: "leave_table",
                        title: "结束离开",
                        description: "从手术台起身",
                        icon: "🚪"
                    }
                ]
            }
        ]
    },

    // 饲主：宠物 vs 立即套现
    // 数据草稿 2026-07-29：事件本身简单，但衍生遗物是大系统（见任务列表.md）
    //   1) 新增遗物「饥饿的怪物」：战斗奖励占用（让/抢/强制占据）+ 好感度阶段解锁（3/6/9 三阶）
    //   2) 战斗奖励生成流程 hook：支持"宠物看上标记"和"强制占据"三态显示
    //   3) 挡刀致命伤拦截通路（好感度 9 阶）
    {
        key: "event_feeder",
        title: "饲主",
        description: "一个佝偻的老人牵着一只饿肚子的怪物，怪物的目光死死盯着你。",
        icon: "🐕",
        options: [
            {
                key: "feed_beast",
                title: "喂养它",
                description: "获得遗物「饥饿的怪物」，它将跟你走。它会占用你的战斗奖励；喂得越多解锁越强（3/6/9 好感度三阶）。",
                icon: "🍖",
                effects: [
                    { key: "gainRelic", params: { relicKey: "event_relic_hungry_beast" } }
                ]
            },
            {
                key: "kill_beast",
                title: "杀掉它",
                description: "立即获得 60 金 + 60 物质。",
                icon: "🗡",
                effects: [
                    { key: "gainGold", params: { amount: 60 } },
                    { key: "gainMaterial", params: { amount: 60 } }
                ]
            }
        ]
    },

    // 孵化室：跨战斗延迟结算，孵化好坏由 3 场承受伤害决定
    // 前置状态 2026-07-29 ✅（可 playtest）：
    //   ✅ 孵化中的胚胎 遗物（event_relic_incubating_embryo）：3 场战斗跨战斗跟踪伤害
    //   ✅ 共生之种 / 饥饿之种 两遗物已入 relicList.ts（event_relic_symbiote_seed / event_relic_hungry_seed）
    //   ✅ 寄生 诅咒卡已入 cardList.ts（original_card_parasite）
    //   剩余(可选): 寄生卡的"被转化/移除时 -3 最大生命"通路（当前 card 触发器系统未验证；卡本身"cannot-play"已生效）
    {
        key: "event_hatchery",
        title: "孵化室",
        description: "桌上放着一枚微微跳动的透明卵，隐隐能感到心跳。",
        icon: "🥚",
        options: [
            {
                key: "take_and_parasite",
                title: "拿走并寄生",
                description: "获得「孵化中的胚胎」遗物。接下来 3 场战斗每场开始 +2 力量，但每回合末受递增伤害。3 场后按累计承受伤害孵化：≤30 → 共生之种，>30 → 饥饿之种（附带 1 张寄生诅咒）。",
                icon: "🐣",
                effects: [
                    { key: "gainRelic", params: { relicKey: "event_relic_incubating_embryo" } }
                ]
            },
            {
                key: "crush_egg",
                title: "碾碎",
                description: "恢复 10% 最大生命",
                icon: "💥",
                effects: [
                    { key: "healHealth", params: { percent: 10 } }
                ]
            }
        ]
    },

    // 献祭祭坛：永久属性 tradeoff（离开也要付代价，"不允许空手而归"）
    // 前置状态 2026-07-29 全部齐 ✅（可 playtest）：
    //   ✅ 秀色可餐 / 浅尝辄止 两遗物已入 relicList.ts
    //   ✅ 事件专属池：直接用 pool: ["exclusive"]
    //   ✅ N 场后禁用通路：沿用无常之神的祝福模板
    //   ✅ ifAble 语法：新增 organCount() accessor（EntityAccessor.ts）
    {
        key: "event_sacrifice_altar",
        title: "献祭祭坛",
        description: "一座石制祭坛，中央刻着凹陷的槽。它低语着，不允许你空手而归。",
        icon: "🗿",
        options: [
            {
                key: "sacrifice_flesh",
                title: "献祭血肉",
                description: "永久失去 50% 最大生命，换取遗物「秀色可餐」（永久 +1 能量上限）",
                icon: "🩸",
                effects: [
                    { key: "loseMaxHealthPercent", params: { percent: 50 } },
                    { key: "gainRelic", params: { relicKey: "original_relic_delectable_feast" } }
                ]
            },
            {
                key: "sacrifice_organ",
                title: "献祭器官",
                description: "自选 1 个已装器官交出（永久失去），换取遗物「浅尝辄止」（下 3 场战斗每回合开始 +1 抽牌数，3 场后禁用）",
                icon: "🫀",
                ifAble: "$owner.removableOrganCount() >= 1",
                effects: [
                    { key: "removeOrgan", params: { count: 1, minCount: 1 } },
                    { key: "gainRelic", params: { relicKey: "original_relic_shallow_taste" } }
                ]
            },
            {
                key: "leave_altar",
                title: "离开",
                description: "祭坛不允许你空手而归——你失去当前生命值等于最大生命的 10%。",
                icon: "🚪",
                effects: [
                    { key: "loseHealthPercent", params: { percent: 10 } }
                ]
            }
        ]
    },

    // // 示例事件4：赌博（复杂交互 - 转盘）
    // {
    //     key: "event_gambling",
    //     title: "赌博",
    //     description: "一个赌徒邀请你参与一场游戏...",
    //     icon: "🎰",
    //     options: [
    //         {
    //             title: "参与赌博（花费 50 金钱）",
    //             description: "转动转盘，获得随机奖励",
    //             icon: "🎲",
    //             effects: [
    //                 { key: "loseGold", params: { amount: 50 } }
    //             ],
    //             // component: "RouletteWheel"  // 自定义转盘组件
    //         },
    //         {
    //             title: "离开",
    //             description: "不参与赌博",
    //             icon: "🚪",
    //             effects: [
    //                 { key: "nothing" }
    //             ]
    //         }
    //     ]
    // },

    // // 示例事件5：卡牌配对（复杂交互）
    // {
    //     key: "event_card_matching",
    //     title: "记忆游戏",
    //     description: "一个神秘的声音邀请你玩一个记忆配对游戏...",
    //     icon: "🃏",
    //     options: [
    //         {
    //             title: "参与游戏",
    //             description: "配对成功的卡牌将加入你的牌组",
    //             icon: "🎮",
    //             // component: "CardMatchingGame"  // 自定义配对游戏组件
    //         },
    //         {
    //             title: "离开",
    //             description: "不参与游戏",
    //             icon: "🚪",
    //             effects: [
    //                 { key: "nothing" }
    //             ]
    //         }
    //     ]
    // }
]
