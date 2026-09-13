/**
 * 游戏设置持久化模块
 *
 * 管理玩家的界面/操作偏好，使用 LocalStorage 存储
 * 设置项通过 settingDefinitions 注册表声明，设置面板遍历注册表渲染，
 * 新增设置项只需要在 GameSettings 加字段 + 往注册表 push 一条定义
 */

import { reactive, watch } from "vue"

// ========== 常量 ==========

/** LocalStorage key */
const SETTINGS_KEY = "born_the_spire_settings"

/** 设置格式版本。从 1 升到 2：默认关闭测试模式，旧存档整份重读默认 */
const CURRENT_VERSION = 2

// ========== 类型定义 ==========

/**
 * 设置结构 V1
 */
export interface GameSettingsV1 {
    version: 1 | 2

    /** 是否在器官方块上直接显示器官介绍（关闭时改为悬停查看） */
    showOrganDescribe: boolean

    /** 动画速度倍率，1 = 正常速度，越大越快 */
    animationSpeed: number

    /** 跳过所有动画演出（受击、死亡、跳字等一律直接出结果） */
    skipAnimation: boolean

    /**
     * 分类动画开关，key 为动画类别（见 ui/animation/categories.ts）
     * 只记玩家主动关掉的项，没记过的一律视为开启，新增类别不会因旧存档缺 key 而默认关闭
     */
    animationCategories: Record<string, boolean>

    /** 开局带秒杀/永生/无敌。控制台 toggleTestMode 切换，下次建角色才生效 */
    testMode: boolean
}

/** 当前使用的设置类型 */
export type GameSettings = GameSettingsV1

/** GameSettings 中值为布尔的字段 key */
export type BooleanSettingKey = {
    [K in keyof GameSettings]: GameSettings[K] extends boolean ? K : never
}[keyof GameSettings]

/** 设置项定义，用于设置面板自动渲染 */
export interface SettingDefinition {
    key: BooleanSettingKey
    label: string
    describe?: string
    type: "boolean"
}

// ========== 设置项注册表 ==========

export const settingDefinitions: SettingDefinition[] = [
    {
        key: "showOrganDescribe",
        label: "显示器官介绍",
        describe: "关闭后器官方块只显示名称，把鼠标移到器官上查看完整介绍",
        type: "boolean"
    }
]

/**
 * 动画速度档位
 * 动画相关的设置项不进 settingDefinitions：它们由设置面板的「动画」分区单独渲染，
 * 分类开关来自动画类别注册表而不是固定字段，塞进同一个注册表会把类型搞得很难看
 */
export const ANIMATION_SPEED_OPTIONS: Array<{ label: string, value: number }> = [
    { label: "0.5x", value: 0.5 },
    { label: "1x", value: 1 },
    { label: "1.5x", value: 1.5 },
    { label: "2x", value: 2 },
    { label: "3x", value: 3 }
]

// ========== 核心 API ==========

/**
 * 创建默认设置
 */
export function createDefaultSettings(): GameSettings {
    return {
        version: CURRENT_VERSION,
        showOrganDescribe: false,
        animationSpeed: 1,
        skipAnimation: false,
        animationCategories: {},
        testMode: false
    }
}

/**
 * 加载设置
 * 没有存档或版本不兼容时返回默认设置
 */
function loadSettings(): GameSettings {
    const defaults = createDefaultSettings()

    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) return defaults

        const parsed = JSON.parse(raw) as Partial<GameSettings>

        // v1 默认把 testMode 写成了 true，公开页会带着秒杀开局。升到 v2 时强制关掉。
        if (parsed.version === 1) {
            return {
                ...defaults,
                ...parsed,
                testMode: false,
                version: CURRENT_VERSION
            }
        }

        if (parsed.version !== CURRENT_VERSION) {
            console.warn(`[Settings] 设置版本不匹配: ${parsed.version} vs ${CURRENT_VERSION}，使用默认设置`)
            return defaults
        }

        // 逐字段兜底，避免旧存档缺字段
        return {
            ...defaults,
            ...parsed,
            version: CURRENT_VERSION
        }
    } catch (e) {
        console.error("[Settings] 加载设置失败:", e)
        return defaults
    }
}

/**
 * 保存设置
 */
export function saveSettings(data: GameSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data))
    } catch (e) {
        console.error("[Settings] 保存设置失败:", e)
    }
}

/**
 * 全局设置对象
 * 直接修改属性即可，变更会自动持久化
 */
export const settings = reactive<GameSettings>(loadSettings())

watch(settings, () => saveSettings(settings), { deep: true })

/**
 * 恢复默认设置
 */
export function resetSettings(): void {
    Object.assign(settings, createDefaultSettings())
}

/** 测试模式开局牌。pool 仍是 test，不会进战斗奖励 */
export const TEST_STARTER_CARDS = [
    "test_card_instant_kill",
    "test_card_immortal",
    "test_card_invincible",
] as const

/** 非测试模式开局：3 打击 + 3 防御 */
export const NORMAL_STARTER_CARDS = [
    "original_card_00001",
    "original_card_00001",
    "original_card_00001",
    "original_card_00014",
    "original_card_00014",
    "original_card_00014",
] as const
