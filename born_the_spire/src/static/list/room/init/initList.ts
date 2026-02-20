/**
 * 初始化房间配置列表
 * 定义游戏开始时的特殊房间（如苏生事件）
 * 这些房间不会出现在普通事件池中
 */

import { InitMap } from "@/core/types/InitMapData"

/**
 * 初始化房间配置列表
 */
export const initList: InitMap[] = [
    // 游戏开始：苏生
    {
        key: "init_game_start",
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
    }
]
