import { ref, shallowRef, onMounted, onBeforeUnmount, computed, type Ref } from "vue"
import { animationManager } from "./AnimationManager"
import type { AnimationHandle, AnimationPlayOptions, AnimationBindingState } from "./types"

/**
 * 动画 composable
 *
 * 在组件内绑定 DOM 元素到动画系统，提供播放/取消动画的方法
 *
 * 用法：
 * ```vue
 * <template>
 *   <div ref="animRef">内容</div>
 * </template>
 *
 * <script setup>
 * const { animRef, play, cancel } = useAnimation('enemy_001')
 * await play('death_fadeout')
 * </script>
 * ```
 */
export function useAnimation(bindingId: string) {
    const animRef: Ref<HTMLElement | null> = ref(null)

    // state 由 bind() 创建，而 bind 发生在 onMounted，比下面几个 computed 的首次求值晚。
    // 直接在 computed 里调 getState 的话，首次会拿到 undefined 并且此后再也不会重算
    // （states 是普通 Map，追踪不到），appendItems / replaceComponent 就永远是空的。
    // 用 shallowRef 把 state 接出来，bind 之后赋值，computed 才会重新求值。
    const stateRef = shallowRef<AnimationBindingState | null>(null)

    onMounted(() => {
        if (animRef.value) {
            animationManager.bind(bindingId, animRef.value)
            stateRef.value = animationManager.getState(bindingId) ?? null
        }
    })

    onBeforeUnmount(() => {
        animationManager.unbind(bindingId)
        stateRef.value = null
    })

    /**
     * 播放动画
     */
    function play(animKey: string, options?: AnimationPlayOptions): Promise<AnimationHandle> {
        return animationManager.play(bindingId, animKey, options)
    }

    /**
     * 取消指定 channel 的动画，不传则取消所有
     */
    function cancel(channel?: string): void {
        animationManager.cancel(bindingId, channel)
    }

    /**
     * 取消所有动画（包括队列）
     */
    function cancelAll(): void {
        animationManager.cancelAll(bindingId)
    }

    /**
     * 当前动画状态（响应式）
     */
    const state = computed(() => stateRef.value)

    /**
     * 是否有任何活跃动画
     */
    const isAnimating = computed(() => {
        const s = stateRef.value
        return s ? s.activeHandles.size > 0 : false
    })

    /**
     * replace 模式当前组件
     */
    const replaceComponent = computed(() => stateRef.value?.replaceComponent ?? null)

    /**
     * append 模式附加项列表
     */
    const appendItems = computed(() => stateRef.value?.appendItems ?? [])

    return {
        animRef,
        play,
        cancel,
        cancelAll,
        state,
        isAnimating,
        replaceComponent,
        appendItems,
    }
}
