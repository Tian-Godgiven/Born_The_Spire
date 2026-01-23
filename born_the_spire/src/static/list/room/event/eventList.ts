/**
 * 事件配置列表
 * 定义游戏中的所有事件
 */

import { Component } from "vue"

/**
 * 事件选项配置
 */
export interface EventOptionMap {
    title: string                   // 选项标题
    description: string             // 选项描述
    icon?: string                   // 选项图标
    effects?: Array<{               // 简单效果列表（使用 eventEffectMap）
        key: string                 // 效果 key
        params?: any                // 效果参数
    }>
    component?: Component | string  // 复杂交互组件（转盘、配对等）
    customCallback?: () => void | Promise<void>  // 自定义回调
}

/**
 * 事件配置映射
 */
export interface EventMap {
    key: string                     // 事件唯一标识
    title: string                   // 事件标题
    description: string             // 事件描述
    icon?: string                   // 事件图标
    options: EventOptionMap[]       // 事件选项列表
    component?: Component | string  // 自定义事件组件（可选）
}

/**
 * 事件配置列表
 */
export const eventList: EventMap[] = [
    // 开场事件：启程
    {
        key: "event_game_start",
        title: "苏生",
        description: "是时候去唤醒尖塔了……",
        icon: "",
        options: [
            {
                title: "向前",
                description: "生长……蠕行……吸收……",
                icon: "",
                effects: [
                    { key: "nothing" }
                ]
            }
        ]
    },

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
        options: [
            {
                title: "饮用泉水",
                description: "回复 50 生命",
                icon: "🍶",
                effects: [
                    { key: "healHealth", params: { amount: 50 } }
                ]
            },
            {
                title: "用泉水净化（移除一张卡牌）",
                description: "净化你的牌组",
                icon: "✨",
                effects: [
                    // TODO: 需要打开卡牌选择界面
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

    // 示例事件4：赌博（复杂交互 - 转盘）
    {
        key: "event_gambling",
        title: "赌博",
        description: "一个赌徒邀请你参与一场游戏...",
        icon: "🎰",
        options: [
            {
                title: "参与赌博（花费 50 金钱）",
                description: "转动转盘，获得随机奖励",
                icon: "🎲",
                effects: [
                    { key: "loseGold", params: { amount: 50 } }
                ],
                // component: "RouletteWheel"  // 自定义转盘组件
            },
            {
                title: "离开",
                description: "不参与赌博",
                icon: "🚪",
                effects: [
                    { key: "nothing" }
                ]
            }
        ]
    },

    // 示例事件5：卡牌配对（复杂交互）
    {
        key: "event_card_matching",
        title: "记忆游戏",
        description: "一个神秘的声音邀请你玩一个记忆配对游戏...",
        icon: "🃏",
        options: [
            {
                title: "参与游戏",
                description: "配对成功的卡牌将加入你的牌组",
                icon: "🎮",
                // component: "CardMatchingGame"  // 自定义配对游戏组件
            },
            {
                title: "离开",
                description: "不参与游戏",
                icon: "🚪",
                effects: [
                    { key: "nothing" }
                ]
            }
        ]
    }
]
