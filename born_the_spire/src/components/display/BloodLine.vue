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
    import { Target } from '@/objects/target/Target';
import gsap from 'gsap';
import { toNumber } from 'lodash';
import { computed, useTemplateRef } from 'vue';
    const {target} = defineProps<{target:Target}>()
    const blood = computed(()=>{
        const health = target.getStatusByKey("original_status_00001") as {value:{now:number,max:number}}
        const percent = toNumber(((health.value.now/health.value.max)*100).toFixed(1))
        animate(percent)
        return health.value
    })
    //动画
    const blackRef = useTemplateRef("blackRef")
    function animate(percent:number){
        if(blackRef.value){
            gsap.to(blackRef.value,{
                width:(percent+"%"),
                duration:0.8,
                ease:'power1.inOut'
            })
        }
        
    }
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