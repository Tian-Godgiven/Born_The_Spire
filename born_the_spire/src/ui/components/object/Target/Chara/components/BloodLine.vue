<template>
<div class="bloodLine">
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
import { computed, useTemplateRef, watch, onMounted } from 'vue';
    const {target} = defineProps<{target:Chara}>()

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
        gsap.to(blackRef.value, {
            width: val + "%",
            duration: 0.8,
            ease: 'power1.inOut'
        })
    })
</script>

<style scoped lang='scss'>
.bloodLine{
    width: 200px;
    height: 20px;
    overflow: hidden;
    border-radius: 30px;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    outline: 2px solid black;
    outline-offset: 2px;
    background-color: white;
    .black,.white{
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        >div{
            line-height: 1rem;
            flex-shrink: 0;
            width: 200px;
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
}
</style>