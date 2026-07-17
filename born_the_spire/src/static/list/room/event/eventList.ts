/**
 * 事件配置列表
 * 定义游戏中的所有事件
 */

import type { EventMap } from "@/core/types/EventMapData"
import { eventEffectMap } from "./eventEffectMap"

/**
 * 事件配置列表
 * 注意：游戏开始的苏生事件已移至 initList.ts，不再作为普通事件
 */
export const eventList: EventMap[] = [
    // 示例事件1：神秘商人
    {
        key: "event_mysterious_merchant",
        title: "神秘商人",
        description: "你遇到了一个神秘的商人，他向你兜售着奇怪的商品...",
        icon: "🧙",
        options: [
            {
                title: "购买神秘药水（花费 50 金钱）",
                description: "获得一瓶随机药水",
                icon: "🧪",
                ifAble: "$owner.reserve(gold) >= 50",
                effects: [
                    { key: "loseGold", params: { amount: 50 } },
                    { key: "gainRandomPotion", params: { count: 1 } }
                ]
            },
            {
                title: "购买神秘遗物（花费 100 金钱）",
                description: "获得一个随机遗物",
                icon: "💎",
                ifAble: "$owner.reserve(gold) >= 100",
                effects: [
                    { key: "loseGold", params: { amount: 100 } },
                    { key: "gainRandomRelic", params: { count: 1 } }
                ]
            },
            {
                title: "离开",
                description: "什么也不做",
                icon: "🚪",
                effects: [
                    { key: "nothing" }
                ]
            }
        ]
    },

    // 示例事件2：宝箱
    {
        key: "event_treasure_chest",
        title: "宝箱",
        description: "你发现了一个宝箱，里面似乎有什么东西...",
        icon: "📦",
        options: [
            {
                title: "打开宝箱",
                description: "获得物质",
                icon: "🔓",
                rewards: [
                    { type: "material", amount: 100 }
                ]
            },
            {
                title: "小心打开（失去 10 生命）",
                description: "获得更多物质和随机遗物",
                icon: "⚠️",
                effects: [
                    { key: "loseHealth", params: { amount: 10 } }
                ],
                rewards: [
                    { type: "material", amount: 150 },
                    { type: "relicSelect", draw: { count: 3 }, selectCount: 1 }
                ]
            },
            {
                title: "离开",
                description: "不冒险",
                icon: "🚪",
                effects: [
                    { key: "nothing" }
                ]
            }
        ]
    },

    // 示例事件3：治疗泉水
    {
        key: "event_healing_spring",
        title: "治疗泉水",
        description: "你发现了一处清澈的泉水，散发着治愈的光芒...",
        icon: "💧",
        mutuallyExclusiveGroups: [
            ["drink_spring", "purify_cards"]  // 饮用和净化互斥，只能选一个
        ],
        options: [
            {
                key: "drink_spring",
                title: "饮用泉水",
                description: "回复 50 生命",
                icon: "🍶",
                effects: [
                    { key: "healHealth", params: { amount: 50 } }
                ]
            },
            {
                key: "purify_cards",
                title: "用泉水净化（移除一张卡牌）",
                description: "净化你的牌组",
                icon: "✨",
                effects: [
                    { key: "removeCard", params: { count: 1, minCount: 0 } }
                ]
            },
            {
                title: "离开",
                description: "保留泉水给其他人",
                icon: "🚪",
                effects: [
                    { key: "nothing" }
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
                title: "第一幕：平静的湖面",
                description: "一座平静的湖面倒映着天空，湖中央似乎有什么东西在闪烁...",
                options: [
                    {
                        title: "丢入一张卡牌",
                        description: "将一张卡牌投入湖中",
                        icon: "🃏",
                        nextScene: "scene2",
                        saveData: async (data) => {
                            data.itemType = 'card'
                            data.itemName = '攻击卡'  // 实际应该打开卡牌选择界面
                            data.itemValue = 10
                        }
                    },
                    {
                        title: "丢入一个器官",
                        description: "将一个器官投入湖中",
                        icon: "🫀",
                        nextScene: "scene2",
                        saveData: async (data) => {
                            data.itemType = 'organ'
                            data.itemName = '心脏'  // 实际应该打开器官选择界面
                            data.itemValue = 20
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
                title: "第二幕：透明的幻影",
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
                title: "第三幕：诚实的奖励",
                description: "精灵微笑着点了点头：'你很诚实，这是你应得的奖励。'",
                options: [
                    {
                        title: "接受奖励",
                        description: "获得升级后的物品和额外奖励",
                        icon: "✨",
                        effects: [
                            { key: "gainMaterial", params: { amount: 200 } },
                            { key: "healHealth", params: { amount: 30 } }
                        ],
                        customCallback: async (data) => {
                            //todo
                        }
                    }
                ]
            },
            {
                key: "scene3_lie",
                title: "第三幕：说谎的惩罚",
                description: "精灵的表情变得严肃：'你说谎了，接受惩罚吧。'",
                options: [
                    {
                        title: "接受惩罚",
                        description: "获得原物品和一张诅咒",
                        icon: "💀",
                        effects: [
                            { key: "loseHealth", params: { amount: 20 } }
                        ],
                        customCallback: async (data) => {
                            //todo
                        }
                    }
                ]
            }
        ]
    },

    // 无常之神：累进赌博（每次停下骰子掷一次，6 阶后自动结束）
    {
        key: "event_god_of_chance",
        title: "无常之神",
        description: "废墟中，一枚骰子在无休止地旋转。",
        icon: "🎲",
        scenes: [
            {
                key: "roll",
                title: "无常之神",
                description: (data) => {
                    const stage = data.stage ?? 0
                    const lines = [
                        "一枚骰子在废墟中无休止地旋转。你【可以】停下它。",
                        "骰子重新旋转起来。你【或许应该】停下它。",
                        "骰子重新旋转起来。你【理应】停下它。",
                        "骰子重新旋转起来。你【必须】停下它。",
                        "骰子重新旋转起来。你【定将】停下它。",
                        "骰子重新旋转起来。你【不得不】停下它。"
                    ]
                    return lines[stage]
                },
                options: [
                    {
                        key: "roll_continue",
                        title: "停下骰子",
                        description: "让它静止一瞬，接受这次裁决",
                        icon: "✋",
                        ifShow: (data) => (data.stage ?? 0) < 5,
                        saveData: (data) => { data.stage = (data.stage ?? 0) + 1 },
                        customCallback: async (data) => {
                            await eventEffectMap["godOfChance_roll"]({ stage: data.stage })
                        },
                        nextScene: "roll"
                    },
                    {
                        key: "roll_final",
                        title: "停下骰子",
                        description: "让它静止一瞬，接受这次裁决",
                        icon: "✋",
                        ifShow: (data) => (data.stage ?? 0) === 5,
                        saveData: (data) => { data.stage = (data.stage ?? 0) + 1 },
                        customCallback: async (data) => {
                            await eventEffectMap["godOfChance_roll"]({ stage: data.stage })
                        },
                        nextScene: "finale"
                    },
                    {
                        key: "leave",
                        title: "让它继续转，转身离开",
                        description: "抵抗诱惑，把骰子留给下一个人",
                        icon: "🚪"
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
                    description: "残响仍在耳边",
                    icon: "🚪"
                }]
            }
        ]
    },

    // 胚胎发育：轮回赌博（多次代价推进器官阶段，第 5 阶段可"进化"重置 + evolutionRounds +1）
    {
        key: "event_embryogenesis",
        title: "胚胎发育",
        description: "一枚微微跳动的胚胎悬浮在你面前——还未成形，却仿佛在等待被塑造。",
        icon: "🥚",
        scenes: [
            {
                key: "main",
                title: "胚胎发育",
                description: (data) => {
                    const stage = data.stage ?? 1
                    const rounds = data.evolutionRounds ?? 0
                    const stageNames = ["合子", "桑葚胚", "囊胚", "原肠胚", "神经胚"]
                    const stageDescs = [
                        "只是一枚受精卵。战斗结束回复 8 生命。",
                        "细胞开始分裂堆聚。每场战斗第一张攻击卡额外触发 1 次。",
                        "内里生成腔体。回合开始 +5 格挡；每场战斗塞入一张【分化】卡到抽牌堆。",
                        "开始向内折叠分化。（专属效果待定。）每场战斗塞入一张【分化】卡。",
                        "神经系统雏形浮现。每场战斗胜利 +5 最大生命并回复 5 生命；每场战斗塞入一张【分化】卡。"
                    ]
                    const roundLine = rounds > 0
                        ? `\n已进化 ${rounds} 轮，效果按轮次强化。`
                        : ""
                    return `胚胎已发育至【${stageNames[stage - 1]}】。\n${stageDescs[stage - 1]}${roundLine}`
                },
                options: [
                    // 接生：结束事件，装当前阶段器官
                    {
                        key: "deliver",
                        title: "接生",
                        description: "把它从悬浮中取下，让它成为你身体的一部分",
                        icon: "🍼",
                        customCallback: async (data) => {
                            await eventEffectMap["deliverEmbryo"]({
                                stage: data.stage ?? 1,
                                evolutionRounds: data.evolutionRounds ?? 0
                            })
                        }
                    },
                    // 让它发育（阶段 1-4）：抽代价 → 跳 costPreview
                    {
                        key: "develop",
                        title: "让它发育",
                        description: "它跳动得更急，仿佛在等你付出什么",
                        icon: "🧬",
                        ifShow: (data) => (data.stage ?? 1) < 5,
                        customCallback: async (data) => {
                            data.pendingCost = await eventEffectMap["drawEmbryoCost"]({ heavy: false })
                        },
                        nextScene: "costPreview"
                    },
                    // 让它进化（阶段 5）：抽重代价 → 跳 costPreview
                    {
                        key: "evolve",
                        title: "让它进化",
                        description: "让它将自己拆散，重新开始——但这次它会记得",
                        icon: "🌀",
                        ifShow: (data) => (data.stage ?? 1) === 5,
                        customCallback: async (data) => {
                            data.pendingCost = await eventEffectMap["drawEmbryoCost"]({ heavy: true })
                        },
                        nextScene: "costPreview"
                    }
                ]
            },
            {
                key: "costPreview",
                title: "胚胎发育",
                description: (data) => {
                    const label = data.pendingCost?.label ?? "……"
                    const isEvolve = (data.stage ?? 1) === 5
                    const next = isEvolve
                        ? "接受它，胚胎将拆散重生，进化轮次 +1。"
                        : "接受它，胚胎将推进至下一阶段。"
                    return `胚胎需要吸取：【${label}】\n${next}\n拒绝它，你只能就此接生它。`
                },
                options: [
                    // 接受代价：付代价 + 阶段推进/进化 → 回 main
                    {
                        key: "acceptCost",
                        title: "接受",
                        description: "让它汲取",
                        icon: "✅",
                        saveData: (data) => {
                            const currentStage = data.stage ?? 1
                            if (currentStage === 5) {
                                data.evolutionRounds = (data.evolutionRounds ?? 0) + 1
                                data.stage = 1
                            } else {
                                data.stage = currentStage + 1
                            }
                        },
                        customCallback: async (data) => {
                            await eventEffectMap["applyEmbryoCost"]({ cost: data.pendingCost })
                            data.pendingCost = null
                        },
                        nextScene: "main"
                    },
                    // 拒绝代价：等同接生（结束事件）
                    {
                        key: "refuseCost",
                        title: "拒绝",
                        description: "太重了。你决定就此接生它",
                        icon: "🚪",
                        customCallback: async (data) => {
                            await eventEffectMap["deliverEmbryo"]({
                                stage: data.stage ?? 1,
                                evolutionRounds: data.evolutionRounds ?? 0
                            })
                        }
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
