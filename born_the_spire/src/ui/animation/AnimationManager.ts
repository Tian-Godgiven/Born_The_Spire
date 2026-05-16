import gsap from "gsap"
import type {
    AnimationDefinition,
    AnimationHandle,
    AnimationPlayOptions,
    AnimationBindingState,
} from "./types"

/**
 * 全局动画管理器
 *
 * 职责：
 *   注册动画定义
 *   调度动画播放（channel 互斥、优先级、重复策略）
 *   管理绑定元素的动画状态
 */
class AnimationManager {
    /** 已注册的动画定义 */
    private definitions = new Map<string, AnimationDefinition>()

    /** 绑定 ID → DOM 元素 */
    private elements = new Map<string, HTMLElement>()

    /** 绑定 ID → 动画状态 */
    private states = new Map<string, AnimationBindingState>()

    /** 绑定 ID → channel → 当前活跃动画 */
    private activeByChannel = new Map<string, Map<string, AnimationHandle>>()

    /** 绑定 ID → channel → 等待队列 */
    private queues = new Map<string, Map<string, Array<() => void>>>()

    // ==================== 注册 ====================

    /**
     * 注册动画定义
     */
    register(definition: AnimationDefinition): void {
        this.definitions.set(definition.key, definition)
    }

    /**
     * 批量注册
     */
    registerAll(definitions: AnimationDefinition[]): void {
        for (const def of definitions) {
            this.register(def)
        }
    }

    /**
     * 获取动画定义
     */
    getDefinition(key: string): AnimationDefinition | undefined {
        return this.definitions.get(key)
    }

    // ==================== 元素绑定 ====================

    /**
     * 绑定 DOM 元素（由 useAnimation 调用）
     */
    bind(bindingId: string, el: HTMLElement): void {
        this.elements.set(bindingId, el)
        if (!this.states.has(bindingId)) {
            this.states.set(bindingId, {
                activeHandles: new Map(),
                replaceComponent: null,
                appendItems: [],
            })
        }
    }

    /**
     * 解绑（组件卸载时调用）
     */
    unbind(bindingId: string): void {
        // 取消所有活跃动画
        this.cancelAll(bindingId)
        this.elements.delete(bindingId)
        this.states.delete(bindingId)
        this.activeByChannel.delete(bindingId)
        this.queues.delete(bindingId)
    }

    /**
     * 获取绑定元素的动画状态
     */
    getState(bindingId: string): AnimationBindingState | undefined {
        return this.states.get(bindingId)
    }

    // ==================== 播放 ====================

    /**
     * 播放动画
     */
    async play(
        bindingId: string,
        animKey: string,
        options?: AnimationPlayOptions,
    ): Promise<AnimationHandle> {
        const def = this.definitions.get(animKey)
        if (!def) {
            throw new Error(`[AnimationManager] 未注册的动画: ${animKey}`)
        }

        const el = this.elements.get(bindingId)
        if (!el) {
            throw new Error(`[AnimationManager] 未绑定的元素: ${bindingId}`)
        }

        const channel = def.channel ?? "default"

        // 检查同 channel 冲突
        const channelMap = this.getChannelMap(bindingId)
        const existing = channelMap.get(channel)

        if (existing && existing.isPlaying()) {
            const existingDef = this.definitions.get(existing.key)
            const existingPriority = existingDef?.priority ?? 0
            const newPriority = def.priority ?? 0

            // 优先级不够，根据策略处理
            if (newPriority < existingPriority) {
                return this.handleLowPriority(bindingId, channel, def, el, options)
            }

            // 同 key 重复触发
            if (existing.key === animKey) {
                const repeat = def.repeat ?? "restart"
                if (repeat === "ignore") {
                    return existing
                }
                if (repeat === "queue") {
                    return this.enqueue(bindingId, channel, def, el, options)
                }
                // restart: 取消当前，继续执行下面的播放逻辑
            }

            // 检查是否可打断
            if (existingDef?.interruptible === false) {
                return this.enqueue(bindingId, channel, def, el, options)
            }

            // 打断当前动画
            existing.cancel()
        }

        return this.playInternal(bindingId, channel, def, el, options)
    }

    /**
     * 取消绑定元素上指定 channel 的动画
     */
    cancel(bindingId: string, channel?: string): void {
        const channelMap = this.activeByChannel.get(bindingId)
        if (!channelMap) return

        if (channel) {
            const handle = channelMap.get(channel)
            if (handle) handle.cancel()
        } else {
            // 取消所有 channel
            for (const handle of channelMap.values()) {
                handle.cancel()
            }
        }
    }

    /**
     * 取消绑定元素上的所有动画
     */
    cancelAll(bindingId: string): void {
        this.cancel(bindingId)
        // 清空队列
        this.queues.delete(bindingId)
    }

    /**
     * 取消全局所有动画（场景切换时使用）
     */
    cancelGlobal(): void {
        for (const bindingId of this.activeByChannel.keys()) {
            this.cancelAll(bindingId)
        }
    }

    // ==================== 内部方法 ====================

    private playInternal(
        bindingId: string,
        channel: string,
        def: AnimationDefinition,
        el: HTMLElement,
        options?: AnimationPlayOptions,
    ): AnimationHandle {
        const timeline = this.buildTimeline(def, el, options)
        let cancelled = false
        let resolvePromise: () => void

        const promise = new Promise<void>((resolve) => {
            resolvePromise = resolve
        })

        const handle: AnimationHandle = {
            key: def.key,
            channel,
            promise,
            cancel: () => {
                if (cancelled) return
                cancelled = true
                timeline.kill()
                this.cleanupHandle(bindingId, channel, handle)
                options?.onCancel?.()
                resolvePromise()
            },
            isPlaying: () => !cancelled && timeline.isActive(),
        }

        // 注册到 channel
        const channelMap = this.getChannelMap(bindingId)
        channelMap.set(channel, handle)

        // 注册到状态
        const state = this.states.get(bindingId)
        if (state) {
            state.activeHandles.set(`${channel}:${def.key}`, handle)
            if (def.mode === "replace" && def.replaceComponent) {
                state.replaceComponent = def.replaceComponent
            }
            if (def.mode === "append" && def.appendComponent) {
                const appendId = `${def.key}_${Date.now()}`
                state.appendItems.push({
                    id: appendId,
                    component: def.appendComponent,
                    props: options?.params,
                })
            }
        }

        // 播放
        options?.onStart?.()
        timeline.play()

        // 动画结束处理
        timeline.eventCallback("onComplete", () => {
            if (!cancelled) {
                this.cleanupHandle(bindingId, channel, handle)
                options?.onEnd?.()
                resolvePromise()
                // 尝试播放队列中的下一个
                this.dequeue(bindingId, channel)
            }
        })

        return handle
    }

    private buildTimeline(
        def: AnimationDefinition,
        el: HTMLElement,
        options?: AnimationPlayOptions,
    ): gsap.core.Timeline {
        let tl: gsap.core.Timeline

        if (def.build) {
            tl = def.build(el, options?.params)
        } else if (def.animate) {
            tl = gsap.timeline({ paused: true })
            const { from, to, duration = 0.5, ease = "power1.inOut" } = def.animate

            if (from && to) {
                tl.fromTo(el, from, { ...to, duration, ease })
            } else if (from) {
                tl.from(el, { ...from, duration, ease })
            } else if (to) {
                tl.to(el, { ...to, duration, ease })
            }
        } else {
            // 空动画（仅用于 replace/append 模式的组件渲染）
            tl = gsap.timeline({ paused: true })
            const duration = def.animate?.duration ?? 0.5
            tl.to(el, { duration })
        }

        // 注入时间轴回调
        if (def.callbacks && options?.onAction) {
            for (const cb of def.callbacks) {
                const atSeconds = cb.at / 1000
                tl.call(
                    () => options.onAction!(cb.action, cb.at),
                    [],
                    atSeconds,
                )
            }
        }

        return tl
    }

    private handleLowPriority(
        bindingId: string,
        channel: string,
        def: AnimationDefinition,
        el: HTMLElement,
        options?: AnimationPlayOptions,
    ): AnimationHandle {
        const repeat = def.repeat ?? "restart"
        if (repeat === "queue") {
            return this.enqueue(bindingId, channel, def, el, options)
        }
        // 优先级不够且不排队 → 返回一个已完成的空 handle
        return this.createNoopHandle(def.key, channel)
    }

    private enqueue(
        bindingId: string,
        channel: string,
        def: AnimationDefinition,
        el: HTMLElement,
        options?: AnimationPlayOptions,
    ): AnimationHandle {
        let resolvePromise: () => void
        const promise = new Promise<void>((resolve) => {
            resolvePromise = resolve
        })
        let cancelled = false

        const handle: AnimationHandle = {
            key: def.key,
            channel,
            promise,
            cancel: () => {
                cancelled = true
                resolvePromise()
            },
            isPlaying: () => false,
        }

        const queueMap = this.getQueueMap(bindingId)
        if (!queueMap.has(channel)) {
            queueMap.set(channel, [])
        }

        queueMap.get(channel)!.push(() => {
            if (!cancelled) {
                const newHandle = this.playInternal(bindingId, channel, def, el, options)
                newHandle.promise.then(() => resolvePromise())
            } else {
                resolvePromise()
            }
        })

        return handle
    }

    private dequeue(bindingId: string, channel: string): void {
        const queueMap = this.queues.get(bindingId)
        if (!queueMap) return
        const queue = queueMap.get(channel)
        if (!queue || queue.length === 0) return
        const next = queue.shift()!
        next()
    }

    private cleanupHandle(
        bindingId: string,
        channel: string,
        handle: AnimationHandle,
    ): void {
        const channelMap = this.activeByChannel.get(bindingId)
        if (channelMap?.get(channel) === handle) {
            channelMap.delete(channel)
        }

        const state = this.states.get(bindingId)
        if (state) {
            state.activeHandles.delete(`${channel}:${handle.key}`)
            const def = this.definitions.get(handle.key)
            if (def?.mode === "replace") {
                state.replaceComponent = null
            }
            if (def?.mode === "append") {
                state.appendItems = state.appendItems.filter(
                    (item) => !item.id.startsWith(handle.key),
                )
            }
        }
    }

    private createNoopHandle(key: string, channel: string): AnimationHandle {
        return {
            key,
            channel,
            promise: Promise.resolve(),
            cancel: () => {},
            isPlaying: () => false,
        }
    }

    private getChannelMap(bindingId: string): Map<string, AnimationHandle> {
        if (!this.activeByChannel.has(bindingId)) {
            this.activeByChannel.set(bindingId, new Map())
        }
        return this.activeByChannel.get(bindingId)!
    }

    private getQueueMap(bindingId: string): Map<string, Array<() => void>> {
        if (!this.queues.has(bindingId)) {
            this.queues.set(bindingId, new Map())
        }
        return this.queues.get(bindingId)!
    }
}

/** 全局动画管理器单例 */
export const animationManager = new AnimationManager()
