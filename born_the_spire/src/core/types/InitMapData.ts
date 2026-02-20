/**
 * 初始化房间类型定义
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
