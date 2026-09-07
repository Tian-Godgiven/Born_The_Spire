<template>
<div ref="animRef" class="chara-animator" :class="{ dead: isDead }">
    <!-- replace 模式：动画组件替换原内容 -->
    <component v-if="replaceComponent" :is="replaceComponent" />
    <slot v-else />
    <!-- append 模式：附加元素 -->
    <component
        v-for="item in appendItems"
        :key="item.id"
        :is="item.component"
        v-bind="item.props"
    />
</div>
</template>

<script setup lang='ts'>
    import { watch, computed, ref, onMounted, onBeforeUnmount } from 'vue'
    import { getCurrentValue } from '@/core/objects/system/Current/current'
    import { useAnimation } from '@/ui/animation'
    import type { Chara } from '@/core/objects/target/Target'

    const props = withDefaults(defineProps<{
        target: Chara
        /** 自定义死亡动画 key，替换默认的 death_fadeout */
        deathAnimation?: string
    }>(), {
        deathAnimation: 'death_fadeout'
    })

    // ========== 动画系统绑定 ==========
    const bindingId = `chara_${props.target.__key ?? props.target.__id}`
    const { animRef, play, replaceComponent, appendItems } = useAnimation(bindingId)

    // ========== 死亡状态 ==========
    const isDying = ref(false)
    const isDead = ref(false)

    const isAlive = computed(() => getCurrentValue(props.target, "isAlive", 1) === 1)

    watch(isAlive, async (alive) => {
        if (!alive && !isDying.value && !isDead.value) {
            isDying.value = true
            try {
                const handle = await play(props.deathAnimation)
                await handle.promise
            } catch {
                // 动画未注册或元素未绑定时静默降级
            }
            isDying.value = false
            isDead.value = true
        }
    })

    // ========== 受击表现 ==========
    // hit_flash / hit_shake 走各自的 channel（color / position），可以同时播
    const hitRemovers: Array<() => void> = []

    onMounted(() => {
        const { remove } = props.target.trigger.appendTrigger({
            when: "after",
            how: "take",
            key: ["attack", "damage"],
            level: 0,
            callback: async (event) => {
                if (event.simulate) return                  // 伤害预览不演出
                if (isDying.value || isDead.value) return   // 死亡演出期间不再抖
                // play 是 async，失败会变成 rejected promise，必须用 catch 兜住
                // （动画未注册或元素还没 bind 时静默降级）
                play('hit_flash').catch(() => {})
                play('hit_shake').catch(() => {})
            }
        })
        hitRemovers.push(remove)
    })

    onBeforeUnmount(() => {
        hitRemovers.forEach(remove => remove())
        hitRemovers.length = 0
    })

    // 暴露状态和播放方法供父组件使用
    defineExpose({ isDying, isDead, play })
</script>

<style scoped lang='scss'>
.chara-animator {
    width: 100%;
    height: 100%;

    &.dead {
        visibility: hidden;
        pointer-events: none;
    }
}
</style>
