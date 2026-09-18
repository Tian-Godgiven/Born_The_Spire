<template>
<div class="bloodLine" :class="size">
    <div class="white">
        <div>{{ blood.now +"/"+blood.max }}</div>
    </div>
    <div class="black" ref="blackRef">
    </div>
</div>
</template>

<script setup lang='ts'>
import { Chara } from '@/core/objects/target/Target';
import gsap from 'gsap';
import { toNumber } from 'lodash';
import { computed, useTemplateRef, watch, onMounted, onBeforeUnmount } from 'vue';
    const {target, size = 'normal'} = defineProps<{target:Chara, size?: 'small'|'normal'}>()

    const blackRef = useTemplateRef("blackRef")

    const blood = computed(()=>{
        const {now,max} = target.getHealth()
        return {now, max}
    })

    const percent = computed(()=>{
        return toNumber(((Number(blood.value.now)/Number(blood.value.max))*100).toFixed(1))
    })

    onMounted(() => {
        // 挂载时直接设置宽度，不播动画
        if (blackRef.value) {
            gsap.set(blackRef.value, { width: percent.value + "%" })
        }
    })

    watch(percent, (val) => {
        if (!blackRef.value) return
        gsap.killTweensOf(blackRef.value)
        gsap.to(blackRef.value, {
            width: val + "%",
            duration: 0.8,
            ease: 'power1.inOut',
            overwrite: true,
        })
    })

    onBeforeUnmount(() => {
        if (blackRef.value) gsap.killTweensOf(blackRef.value)
    })
</script>

<style scoped lang='scss'>
.bloodLine{
    width: 100%;
    height: var(--layout-blood-line-height, 20px);
    overflow: hidden;
    border-radius: 30px;
    position: relative;
    outline: var(--layout-blood-line-outline, 2px) solid black;
    outline-offset: 2px;
    background-color: white;
    .black,.white{
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        >div{
            line-height: var(--layout-blood-line-text-line-height, 1rem);
            flex-shrink: 0;
            width: 100%;
            text-align: center;
        }
    }
    .black{
        background-color: white;
        mix-blend-mode: difference;
    }
    .white{
        background-color: white;
        color: black;
    }
    &.small {
        width: 76%;
        height: 14px;
        font-size: 12px;
        outline-width: 1px;
    }
}
</style>
