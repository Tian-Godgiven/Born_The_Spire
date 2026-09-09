import gsap from "gsap"
import { markRaw, shallowReactive } from "vue"
import { settings } from "@/core/persistence/settings"
import { isAnimationCategoryEnabled } from "./categories"
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

    /** append 项 id 的自增序号（不能用 Date.now()，同毫秒的连续播放会撞 id） */
    private appendSeq = 0

    // ==================== 全局开关 ====================

    /**
     * 全局动画速度倍率
     * 每次播放时现取，改设置后立刻对新动画生效（已在播的那一条不受影响）
     */
    private get speed(): number {
        const value = Number(settings.animationSpeed)
        return Number.isFinite(value) && value > 0 ? value : 1
    }

    /** 是否跳过所有动画 */
    private get skipped(): boolean {
        return settings.skipAnimation === true
    }

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
            // state / appendItems 都用 shallowReactive：v-for 要追踪增删，但不能深度代理
            // 组件定义（否则 <component :is> 会报 Component that was made a reactive object）。
            const state: AnimationBindingState = shallowReactive({
                activeHandles: new Map<string, AnimationHandle>(),
                replaceComponent: null as any,
                appendItems: shallowReactive([] as AnimationBindingState["appendItems"]),
            })
            this.states.set(bindingId, state)
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

        // 跳过动画（总开关）或所属类别被玩家关掉：不建时间轴、不动 DOM，直接走完回调并结束
        if (this.skipped || !isAnimationCategoryEnabled(def.category)) {
            return this.playSkipped(def, channel, options)
        }

        // append 模式天然多实例并存（连击的每个跳字都是独立的一份），不走 channel 互斥：
        // 否则第二次播放会把第一个还挂在空中的实例 cancel 掉
        if (def.mode === "append") {
            return this.playInternal(bindingId, channel, def, el, options)
        }

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
        for (const bindingId of [...this.activeByChannel.keys()]) {
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
        const speed = this.speed
        const timeline = this.buildTimeline(def, el, options)
        // 统一按全局倍率缩放，overlay / replace 的 gsap 动画和 append 的计时器都受它控制
        timeline.timeScale(speed)
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

        const isAppend = def.mode === "append"

        // 注册到 channel（append 除外：它要多实例并存，占了 channel 会被后来者 cancel）
        if (!isAppend) {
            const channelMap = this.getChannelMap(bindingId)
            channelMap.set(channel, handle)
        }

        // 注册到状态
        const state = this.states.get(bindingId)
        if (state) {
            if (isAppend && def.appendComponent) {
                const appendId = `${def.key}_${this.appendSeq++}`
                handle.appendId = appendId
                state.activeHandles.set(appendId, handle)
                state.appendItems.push({
                    id: appendId,
                    component: markRaw(def.appendComponent),
                    // 把实际时长一并交给组件，让它自己的动画和这里的计时器对齐。
                    // 组件里是 CSS 动画，gsap 的 timeScale 管不到它，所以这里得自己按倍率换算
                    props: { ...options?.params, duration: this.resolveDuration(def) / speed },
                })
            } else {
                state.activeHandles.set(`${channel}:${def.key}`, handle)
                if (def.mode === "replace" && def.replaceComponent) {
                    state.replaceComponent = markRaw(def.replaceComponent)
                }
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

        if (def.mode === "append") {
            // append 模式一律不碰宿主元素：视觉全在 appendComponent 内部，
            // 这里只对一个空对象补间，纯粹当"多久之后把组件摘掉"的计时器。
            // （旧实现是 tl.to(el, ...)，结果 y: -40 飘走的是角色本体而不是跳字）
            tl = gsap.timeline({ paused: true })
            tl.to({}, { duration: this.resolveDuration(def) })
        } else if (def.build) {
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
            tl.to(el, { duration: 0.5 })
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
            state.activeHandles.delete(handle.appendId ?? `${channel}:${handle.key}`)
            const def = this.definitions.get(handle.key)
            if (def?.mode === "replace") {
                state.replaceComponent = null
            }
            if (def?.mode === "append" && handle.appendId) {
                // 按 appendId 精确摘除：旧实现按 key 前缀过滤，
                // 连击时第一个跳字播完会把同 key 的其他实例一起抹掉。
                // 必须原地 splice，重新赋值会把响应式数组换成普通数组
                const index = state.appendItems.findIndex((item) => item.id === handle.appendId)
                if (index >= 0) state.appendItems.splice(index, 1)
            }
        }
    }

    /** append 模式的存活时长（秒）：优先顶层 duration，其次 animate.duration，最后兜底 1 秒 */
    private resolveDuration(def: AnimationDefinition): number {
        return def.duration ?? def.animate?.duration ?? 1
    }

    /**
     * 跳过动画时的播放路径
     *
     * 关键：promise 必须 resolve（createNoopHandle 给的是 Promise.resolve()）。
     * 死亡演出、卡牌展示这些地方都在 await handle.promise，不 resolve 会永久卡死流程。
     * 时间轴回调也要就地补触发，否则靠 callbacks 推进的多阶段演出会缺步骤。
     */
    private playSkipped(
        def: AnimationDefinition,
        channel: string,
        options?: AnimationPlayOptions,
    ): AnimationHandle {
        options?.onStart?.()

        if (def.callbacks && options?.onAction) {
            for (const cb of def.callbacks) {
                options.onAction(cb.action, cb.at)
            }
        }

        options?.onEnd?.()
        return this.createNoopHandle(def.key, channel)
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
