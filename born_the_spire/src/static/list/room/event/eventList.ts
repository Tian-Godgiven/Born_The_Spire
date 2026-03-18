/**
 * 事件配置列表
 * 定义游戏中的所有事件
 */

import type { EventMap } from "@/core/types/EventMapData"

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
                effects: [
                    { key: "loseGold", params: { amount: 50 } },
                    { key: "gainRandomPotion", params: { count: 1 } }
                ]
            },
            {
                title: "购买神秘遗物（花费 100 金钱）",
                description: "获得一个随机遗物",
                icon: "💎",
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
                description: "获得随机奖励",
                icon: "🔓",
                effects: [
                    { key: "gainMaterial", params: { amount: 100 } },
                    { key: "gainRandomCard", params: { count: 1 } }
                ]
            },
            {
                title: "小心打开（失去 10 生命）",
                description: "更安全地打开，但需要付出代价",
                icon: "⚠️",
                effects: [
                    { key: "loseHealth", params: { amount: 10 } },
                    { key: "gainMaterial", params: { amount: 150 } },
                    { key: "gainRandomRelic", params: { count: 1 } }
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
                    // 需要打开卡牌选择界面
                    { key: "healHealth", params: { amount: 20 } }
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
                        condition: (data) => data.itemType === 'card',
                        nextScene: "scene3_honest",
                        saveData: (data) => { data.honest = true }
                    },
                    {
                        key: "lie_card",
                        title: "是器官",
                        description: "说谎称丢入的是器官",
                        icon: "🫀",
                        condition: (data) => data.itemType === 'card',
                        nextScene: "scene3_lie",
                        saveData: (data) => { data.honest = false }
                    },
                    {
                        key: "honest_organ",
                        title: "是器官",
                        description: "诚实地承认丢入的是器官",
                        icon: "🫀",
                        condition: (data) => data.itemType === 'organ',
                        nextScene: "scene3_honest",
                        saveData: (data) => { data.honest = true }
                    },
                    {
                        key: "lie_organ",
                        title: "是卡牌",
                        description: "说谎称丢入的是卡牌",
                        icon: "🃏",
                        condition: (data) => data.itemType === 'organ',
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
                            console.log(`[湖面精灵] 诚实奖励：升级 ${data.itemName}`)
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
                            console.log(`[湖面精灵] 说谎惩罚：返还 ${data.itemName} 并获得诅咒`)
                        }
                    }
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
