import type gsap from "gsap"

/**
 * 动画效果模式
 *
 * overlay:  保持原 DOM 不变，叠加视觉效果（闪烁、发光、变色）
 * replace:  临时替换 DOM 内容播放动画（死亡演出、变身）
 * append:   在 DOM 旁边/上方添加额外元素（跳字、粒子）
 */
export type AnimationMode = "overlay" | "replace" | "append"

/**
 * 同 key 动画重复触发时的行为
 *
 * restart:  重新开始
 * ignore:   忽略新触发
 * queue:    排队等当前播完再播
 */
export type RepeatStrategy = "restart" | "ignore" | "queue"

/**
 * 时间轴回调节点
 */
export interface AnimationCallback {
    /** 触发时机（毫秒） */
    at: number
    /** 回调标识 key，由调用方决定具体行为 */
    action: string
}

/**
 * 声明式动画简写
 * 适合简单动画，对 mod 作者友好
 */
export interface AnimationShorthand {
    from?: gsap.TweenVars
    to?: gsap.TweenVars
    duration?: number
    ease?: string
}

/**
 * 动画定义
 */
export interface AnimationDefinition {
    /** 动画唯一标识 */
    key: string
    /** 效果模式 */
    mode: AnimationMode

    /** 同 channel 互斥，不同 channel 并行。默认 "default" */
    channel?: string
    /** 同 channel 内高优先级打断低优先级。默认 0 */
    priority?: number
    /** 同 key 重复触发时的行为。默认 "restart" */
    repeat?: RepeatStrategy
    /** 是否可被其他动画打断。默认 true */
    interruptible?: boolean

    /**
     * GSAP 动画构建器（复杂动画）
     * 返回一个 GSAP Timeline，由 AnimationManager 控制播放
     */
    build?: (el: HTMLElement, params?: Record<string, any>) => gsap.core.Timeline

    /**
     * 声明式简写（简单动画）
     * 与 build 二选一，build 优先
     */
    animate?: AnimationShorthand

    /** 时间轴回调节点 */
    callbacks?: AnimationCallback[]

    /**
     * replace 模式专用：用于替换 DOM 内容的 Vue 组件
     */
    replaceComponent?: any

    /**
     * append 模式专用：用于附加到 DOM 上的 Vue 组件
     */
    appendComponent?: any
}

/**
 * 动画播放参数
 */
export interface AnimationPlayOptions {
    /** 传递给 build / animate 的额外参数 */
    params?: Record<string, any>
    /** 时间轴回调处理器 */
    onAction?: (actionKey: string, elapsed: number) => void
    /** 动画开始时 */
    onStart?: () => void
    /** 动画结束时 */
    onEnd?: () => void
    /** 动画被取消时 */
    onCancel?: () => void
}

/**
 * 动画句柄，用于控制正在播放的动画
 */
export interface AnimationHandle {
    /** 动画 key */
    key: string
    /** channel */
    channel: string
    /** 等待动画结束 */
    promise: Promise<void>
    /** 主动取消 */
    cancel(): void
    /** 是否正在播放 */
    isPlaying(): boolean
}

/**
 * 绑定元素上的动画状态（供 useAnimation 使用）
 */
export interface AnimationBindingState {
    /** 当前所有活跃动画的 handle */
    activeHandles: Map<string, AnimationHandle>
    /** replace 模式正在使用的组件 */
    replaceComponent: any | null
    /** append 模式的附加组件列表 */
    appendItems: Array<{ id: string; component: any; props?: Record<string, any> }>
}
