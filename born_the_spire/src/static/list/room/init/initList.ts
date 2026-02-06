/**
 * 初始化房间配置列表
 * 定义游戏开始时的特殊房间（如苏生事件）
 * 这些房间不会出现在普通事件池中
 */

import { Component } from "vue"

/**
 * 初始化选项配置
 */
export interface InitOptionMap {
    title: string                   // 选项标题
    description: string             // 选项描述
    icon?: string                   // 选项图标
    effects?: Array<{               // 简单效果列表
        key: string                 // 效果 key
        params?: any                // 效果参数
    }>
    component?: Component | string  // 复杂交互组件
    customCallback?: () => void | Promise<void>  // 自定义回调
}

/**
 * 初始化房间配置
 */
export interface InitMap {
    key: string                     // 初始化房间唯一标识
    title: string                   // 标题
    description: string             // 描述
    icon?: string                   // 图标
    options: InitOptionMap[]        // 选项列表
    component?: Component | string  // 自定义组件（可选）
}

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
