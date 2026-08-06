/**
 * 动画类别注册表
 *
 * 每个动画定义可以声明自己属于哪个类别，玩家在设置里按类别开关演出。
 * 类别本身走注册表：Mod 既可以把自己的动画挂到内置类别上，也可以注册新类别，
 * 设置面板会自动多出一行，不需要改核心代码。
 */

import { settings } from "@/core/persistence/settings"

export interface AnimationCategory {
    /** 类别唯一标识，动画定义里的 category 字段填的就是它 */
    key: string
    /** 设置面板里显示的名字 */
    label: string
    /** 设置面板里的补充说明 */
    describe?: string
}

const categories = new Map<string, AnimationCategory>()

/**
 * 注册一个动画类别
 */
export function registerAnimationCategory(category: AnimationCategory): void {
    categories.set(category.key, category)
}

/**
 * 批量注册
 */
export function registerAnimationCategories(list: AnimationCategory[]): void {
    for (const category of list) {
        registerAnimationCategory(category)
    }
}

/**
 * 获取所有已注册类别（设置面板遍历它渲染开关）
 */
export function getAnimationCategories(): AnimationCategory[] {
    return [...categories.values()]
}

/**
 * 某个类别当前是否启用
 *
 * 存档里只记被玩家关掉的项，没记过的一律视为开启，
 * 这样以后新增类别不会因为旧存档里缺 key 就默认关闭
 */
export function isAnimationCategoryEnabled(key?: string): boolean {
    if (!key) return true   // 没声明类别的动画不受开关管辖
    return settings.animationCategories[key] !== false
}

/**
 * 设置某个类别的开关
 */
export function setAnimationCategoryEnabled(key: string, enabled: boolean): void {
    settings.animationCategories[key] = enabled
}

/**
 * 内置动画类别
 */
export const presetAnimationCategories: AnimationCategory[] = [
    {
        key: "hit",
        label: "受击表现",
        describe: "挨打时的白闪和震动"
    },
    {
        key: "hitText",
        label: "伤害跳字",
        describe: "角色头顶飘出的伤害、格挡、治疗数字"
    },
    {
        key: "heal",
        label: "治疗表现",
        describe: "回复生命时的辉光"
    },
    {
        key: "death",
        label: "死亡演出",
        describe: "角色倒下时的淡出，关闭后直接消失"
    },
    {
        key: "card",
        label: "卡牌演出",
        describe: "卡牌出现、升空、复制时的动画"
    },
    {
        key: "ui",
        label: "界面通用",
        describe: "淡入淡出、弹出、脉冲等界面小动效"
    }
]
