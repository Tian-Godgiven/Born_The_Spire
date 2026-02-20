/**
 * 游戏机制配置
 * 用于定义类似护甲、能量护盾等"有数据+有行为+有UI"的游戏机制
 */

import { Component } from "vue"
import { Entity } from "@/core/objects/system/Entity"
import { ActionEvent } from "@/core/objects/system/ActionEvent"
import { Effect } from "@/core/objects/system/Effect"

/**
 * 数据存储配置
 */
export interface MechanismDataConfig {
    location: "current" | "status" | "custom"  // 存储位置
    key?: string                                // 存储键名（默认使用 mechanism key）
    defaultValue: number | boolean | object    // 默认值
}

/**
 * 吸收伤害行为配置
 */
export interface AbsorbDamageBehavior {
    enabled: true
    priority?: number                          // 优先级（多个机制时的执行顺序）
    absorb: (mechanismValue: number, damageAmount: number, event: ActionEvent) => number  // 返回吸收的伤害量
}

/**
 * 清零行为配置
 */
export interface ClearBehavior {
    onTurnStart?: boolean                      // 回合开始时清零
    onTurnEnd?: boolean                        // 回合结束时清零
    onBattleEnd?: boolean                      // 战斗结束时清零
    onDamaged?: boolean                        // 受到伤害后清零
    duration?: number                          // 持续回合数（0=永久）
    custom?: (mechanismValue: number, entity: Entity) => boolean  // 自定义清零条件
}

/**
 * 获得量修饰配置
 */
export interface GainModifierConfig {
    additiveKey?: string                       // 加法修饰的 Status 键名（如 "armorGain"）
    multiplicativeKey?: string                 // 乘法修饰的 Status 键名（如 "armorGainMultiplier"）
}

/**
 * 自定义触发器配置
 */
export interface CustomTriggerConfig {
    when: "before" | "after"
    how: "make" | "via" | "take"
    key: string                                // 事件 key
    callback: (event: ActionEvent, effect: Effect, mechanismValue: number, entity: Entity) => void | Promise<void>
    level?: number
}

/**
 * 逻辑层配置
 */
export interface MechanismLogicConfig {
    absorbDamage?: AbsorbDamageBehavior        // 吸收伤害行为
    clear?: ClearBehavior                      // 清零行为
    gainModifier?: GainModifierConfig          // 获得量修饰
    customTriggers?: CustomTriggerConfig[]     // 自定义触发器
}

/**
 * UI 显示位置（预设位置）
 */
export type UIPosition =
    | "characterTop"      // 角色头顶
    | "characterBottom"   // 角色底部
    | "characterLeft"     // 角色左侧
    | "characterRight"    // 角色右侧
    | "healthBarRight"    // 血条右侧
    | "sidebar"           // 侧边栏
    | "topBar"            // 顶部栏
    | "custom"            // 完全自定义

/**
 * UI 配置
 */
export interface MechanismUIConfig {
    position: UIPosition                       // 显示位置
    component?: Component | string             // 自定义 Vue 组件（可选）
    showWhen?: (mechanismValue: number, entity: Entity) => boolean  // 显示条件

    // 如果使用预设位置，可以配置相对偏移
    offset?: {
        x?: number
        y?: number
    }

    // 如果使用 custom 位置，需要提供完整的定位信息
    customPosition?: {
        top?: string
        left?: string
        right?: string
        bottom?: string
    }
}

/**
 * 游戏机制完整配置
 */
export interface MechanismConfig {
    key: string                                // 机制唯一标识
    label: string                              // 显示名称
    icon?: string                              // 图标
    description?: string                       // 描述

    data: MechanismDataConfig                  // 数据层配置
    logic?: MechanismLogicConfig               // 逻辑层配置
    ui?: MechanismUIConfig                     // UI 层配置
}
