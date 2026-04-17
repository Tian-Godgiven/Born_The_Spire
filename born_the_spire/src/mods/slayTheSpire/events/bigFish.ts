/**
 * SlayTheSpire Mod - 大鱼事件
 */

import type { EventMap } from '@/core/types/EventMapData'

export const bigFishEvent: EventMap = {
    key: "sts_event_big_fish",
    title: "大鱼",
    description: "当你走过一条长廊时，你看见空中漂浮着一根香蕉，一个甜甜圈，和一个盒子。不……仔细一看，它们都是被用绳子系着，从天花板上的几个洞里悬挂下来的。你在接近这几样东西时，上方似乎传来一阵咯咯的笑声。\n你会怎么做？",
    icon: "🐟",
    scenes: [
        {
            key: "choice",
            title: "大鱼",
            description: "当你走过一条长廊时，你看见空中漂浮着一根香蕉，一个甜甜圈，和一个盒子。不……仔细一看，它们都是被用绳子系着，从天花板上的几个洞里悬挂下来的。你在接近这几样东西时，上方似乎传来一阵咯咯的笑声。\n你会怎么做？",
            options: [
                {
                    title: "香蕉",
                    description: "回复最大生命值的1/3。",
                    icon: "🍌",
                    nextScene: "banana_result",
                    effects: [
                        { key: "healHealth", params: { divisor: 3 } }
                    ]
                },
                {
                    title: "甜甜圈",
                    description: "最大生命值 +5。",
                    icon: "🍩",
                    nextScene: "donut_result",
                    effects: [
                        { key: "gainMaxHealth", params: { amount: 5 } }
                    ]
                },
                {
                    title: "盒子",
                    description: "获得一件遗物。被诅咒——悔恨。",
                    icon: "📦",
                    nextScene: "box_result",
                    effects: [
                        { key: "gainRandomRelic", params: { count: 1 } },
                        { key: "gainCard", params: { cardKey: "sts_card_regret" } }
                    ]
                }
            ]
        },
        {
            key: "banana_result",
            title: "香蕉",
            description: "你吃下了香蕉，它很有营养，似乎还有些魔法，回复了你的生命。",
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "donut_result",
            title: "甜甜圈",
            description: "你吃下了甜甜圈，真是太好吃了！你的最大生命值增加了。",
            options: [{
                title: "离开",
                description: ""
            }]
        },
        {
            key: "box_result",
            title: "盒子",
            description: "你抓住了盒子，在里面找到了一个遗物！\n可是，你真的很想吃那个甜甜圈……你的心中充满了悲伤，尤其是一份悔恨。",
            options: [{
                title: "离开",
                description: ""
            }]
        }
    ]
}
