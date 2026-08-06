<template>
<div class="hit-text" :class="kind" :style="style">{{ text }}</div>
</template>

<script setup lang='ts'>
    import { computed } from 'vue'

    /**
     * 受击跳字的单个条目（append 模式的 appendComponent）
     *
     * 视觉完全由这里的 CSS 负责，AnimationManager 只按 duration 计时决定什么时候把它摘掉。
     * duration 由 manager 注入（已换算过全局动画速度），组件用它设自己的 animation-duration，
     * 两边对齐才不会出现"动画还没播完组件就没了"或者"播完了还赖着不走"。
     */
    const props = withDefaults(defineProps<{
        text: string
        kind?: 'damage' | 'block' | 'heal'
        /** 相对角色中线的水平偏移，连击时左右交错 */
        offsetX?: number
        /** 存活时长（秒），由 AnimationManager 注入 */
        duration?: number
    }>(), {
        kind: 'damage',
        offsetX: 0,
        duration: 1.8
    })

    const style = computed(() => ({
        left: `calc(50% + ${props.offsetX}px)`,
        animationDuration: `${props.duration}s`
    }))
</script>

<style scoped lang='scss'>
.hit-text {
    position: absolute;
    top: 40%;
    white-space: nowrap;
    font-weight: bold;
    line-height: 1;
    pointer-events: none;
    // 白描边让数字压在器官方块的黑边上也能看清（项目禁用阴影，这里用描边代替）
    -webkit-text-stroke: 4px white;
    paint-order: stroke fill;
    animation-name: hit-float;
    animation-timing-function: ease-out;
    animation-fill-mode: both;

    &.damage {
        font-size: 28px;
        color: black;
    }

    &.block {
        font-size: 18px;
        color: #777;
    }

    &.heal {
        font-size: 24px;
        color: black;
    }
}

// 前 20% 弹出，中段几乎悬停让人看清数字，最后再飘走淡出
@keyframes hit-float {
    0% {
        opacity: 0;
        transform: translate(-50%, 6px) scale(0.7);
    }
    10% {
        opacity: 1;
        transform: translate(-50%, -10px) scale(1.12);
    }
    20% {
        opacity: 1;
        transform: translate(-50%, -18px) scale(1);
    }
    65% {
        opacity: 1;
        transform: translate(-50%, -34px) scale(1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -76px) scale(1);
    }
}
</style>
