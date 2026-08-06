<template>
<div ref="animRef" class="hit-text-layer">
    <component
        v-for="item in appendItems"
        :key="item.id"
        :is="item.component"
        v-bind="item.props"
    />
</div>
</template>

<script setup lang='ts'>
    import { onMounted, onBeforeUnmount } from 'vue'
    import { Chara } from '@/core/objects/target/Target'
    import { getCurrentValue } from '@/core/objects/system/Current/current'
    import { useAnimation } from '@/ui/animation'
    import type { ActionEvent } from '@/core/objects/system/ActionEvent'
    import type { Effect } from '@/core/objects/system/effect/Effect'

    const props = defineProps<{ target: Chara }>()

    // 独立于 CharaAnimator 的绑定（那边是 chara_xxx），飘字层要活在死亡淡出之外
    const bindingId = `chara_hit_${props.target.__key ?? props.target.__id}`
    const { animRef, play, appendItems } = useAnimation(bindingId)

    type HitKind = 'damage' | 'block' | 'heal'

    // ========== 连击排布 ==========
    // 同一事务内的连续跳字算一轮连击：第一个居中，之后左右交替并逐步外扩、依次飘出。
    // 事务换了或间隔超过 COMBO_GAP 就重新起一轮。
    const COMBO_GAP = 700       // ms
    const COMBO_STAGGER = 100   // ms，同一轮内每个跳字的出场间隔
    let lastTransaction: unknown = null
    let lastPushAt = 0
    let comboIndex = 0

    // 错开出场用延迟 play 而不是 CSS animation-delay：
    // manager 的计时器从 play 那刻开始算，用 CSS 延迟的话组件会比动画先一步被摘掉
    const pendingTimers: number[] = []

    function pushText(text: string, kind: HitKind, event: ActionEvent) {
        const transaction = (event as any)._transaction ?? null
        const now = Date.now()

        if (transaction !== lastTransaction || now - lastPushAt > COMBO_GAP) {
            comboIndex = 0
        }
        lastTransaction = transaction
        lastPushAt = now

        // 0 居中，1 偏左，2 偏右，3 更左，4 更右……
        const direction = comboIndex === 0 ? 0 : (comboIndex % 2 === 1 ? -1 : 1)
        const spread = Math.ceil(comboIndex / 2)
        const offsetX = direction * (12 + spread * 14)
        const delay = comboIndex * COMBO_STAGGER
        comboIndex++

        const fire = () => play('hit_text', { params: { text, kind, offsetX } }).catch(() => {})

        if (delay === 0) {
            fire()
            return
        }
        const timer = window.setTimeout(() => {
            const index = pendingTimers.indexOf(timer)
            if (index >= 0) pendingTimers.splice(index, 1)
            fire()
        }, delay)
        pendingTimers.push(timer)
    }

    // ========== 数值采样 ==========
    // 不读 effect.params.value，而是对 health / armor 取前后快照做差：
    // 这样减伤、护甲吸收、生命上限截断全都自动算进去，显示的永远是真正发生的变化量。
    const snapshots = new WeakMap<Effect, { health: number, armor: number }>()

    function takeSnapshot(effect: Effect | null) {
        // effect 为 null 说明这是事件级触发（event.key 命中），效果级那次才是我们要的
        if (!effect) return
        snapshots.set(effect, {
            health: getCurrentValue(props.target, "health", 0),
            armor: getCurrentValue(props.target, "armor", 0)
        })
    }

    // before 触发器的 level 必须高于护甲吸收（mechanismRegistry 里 absorbDamage.priority = 100），
    // 触发器按 level 降序执行，否则快照拿到的已经是扣完护甲的值，算不出格挡量
    const SNAPSHOT_LEVEL = 1000

    const removers: Array<() => void> = []

    onMounted(() => {
        const trigger = props.target.trigger

        // 伤害：before 存快照，after 比对
        removers.push(trigger.appendTrigger({
            when: "before",
            how: "take",
            key: "damage",
            level: SNAPSHOT_LEVEL,
            callback: async (event, effect) => {
                if (event.simulate) return   // 伤害预览不飘字
                takeSnapshot(effect)
            }
        }).remove)

        removers.push(trigger.appendTrigger({
            when: "after",
            how: "take",
            key: "damage",
            level: 0,
            callback: async (event, effect) => {
                if (event.simulate || !effect) return
                const before = snapshots.get(effect)
                if (!before) return
                snapshots.delete(effect)

                const absorbed = before.armor - getCurrentValue(props.target, "armor", 0)
                const lost = before.health - getCurrentValue(props.target, "health", 0)

                if (absorbed > 0) pushText(`格挡-${absorbed}`, 'block', event)
                if (lost > 0) pushText(`-${lost}`, 'damage', event)
            }
        }).remove)

        // 治疗：同样走快照，避免顶到生命上限时显示虚高的数字
        removers.push(trigger.appendTrigger({
            when: "before",
            how: "take",
            key: "heal",
            level: SNAPSHOT_LEVEL,
            callback: async (event, effect) => {
                if (event.simulate) return
                takeSnapshot(effect)
            }
        }).remove)

        removers.push(trigger.appendTrigger({
            when: "after",
            how: "take",
            key: "heal",
            level: 0,
            callback: async (event, effect) => {
                if (event.simulate || !effect) return
                const before = snapshots.get(effect)
                if (!before) return
                snapshots.delete(effect)

                const healed = getCurrentValue(props.target, "health", 0) - before.health
                if (healed > 0) pushText(`+${healed}`, 'heal', event)
            }
        }).remove)
    })

    onBeforeUnmount(() => {
        removers.forEach(remove => remove())
        removers.length = 0
        pendingTimers.forEach(timer => window.clearTimeout(timer))
        pendingTimers.length = 0
    })
</script>

<style scoped lang='scss'>
// 飘字层不参与布局也不吃鼠标事件，只负责在角色上方叠一层数字
.hit-text-layer {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
    z-index: 20;
}
</style>
