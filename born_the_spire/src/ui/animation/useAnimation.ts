import { ref, onMounted, onBeforeUnmount, computed, type Ref } from "vue"
import { animationManager } from "./AnimationManager"
import type { AnimationHandle, AnimationPlayOptions } from "./types"

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

    onMounted(() => {
        if (animRef.value) {
            animationManager.bind(bindingId, animRef.value)
        }
    })

    onBeforeUnmount(() => {
        animationManager.unbind(bindingId)
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
    const state = computed(() => animationManager.getState(bindingId))

    /**
     * 是否有任何活跃动画
     */
    const isAnimating = computed(() => {
        const s = animationManager.getState(bindingId)
        return s ? s.activeHandles.size > 0 : false
    })

    /**
     * replace 模式当前组件
     */
    const replaceComponent = computed(() => {
        const s = animationManager.getState(bindingId)
        return s?.replaceComponent ?? null
    })

    /**
     * append 模式附加项列表
     */
    const appendItems = computed(() => {
        const s = animationManager.getState(bindingId)
        return s?.appendItems ?? []
    })

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
