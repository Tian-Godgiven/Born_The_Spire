<template>
<div class="hoverShow" 
    @mouseenter="handleMouseenter" 
    @mouseleave="handleMouseleave">
    <span ref="mainRef" class="hoverMain">
        <slot></slot>
    </span>
    <Teleport defer to="#hoverShowContainer">
        <div class="hover"
            @mouseenter="handleMouseenter" 
            @mouseleave="handleMouseleave"
            :style="hoverStyle"
            ref="hoverRef"
            v-if="ifHover">
            <slot name="hover"></slot>
        </div>
    </Teleport>
</div>
</template>

<script setup lang='ts'>
    import { ref, computed, useTemplateRef } from 'vue';
    const {hoverPosition="left",maxWidth=300} = defineProps<{
        hoverPosition?:"left"|"right"|"top"|"bottom",
        maxWidth?:number
    }>()
    const offset = 12//偏移量aka间距
    const waitTime = 200//移除后等待时间，单位ms

    const mainRef = useTemplateRef("mainRef");
    const hoverRef = useTemplateRef("hoverRef")
    // const ifShowHover = computed(()=>{
    //     return ifHover || ifInHover
    // })

    //hover控制显示
    const ifHover = ref(false)
    let hoverTimeOut:NodeJS.Timeout|null = null
    function handleMouseenter(){
        ifHover.value = true
        //移除定时器
        if(hoverTimeOut){
            clearTimeout(hoverTimeOut)
        }
    }
    function handleMouseleave(){
        hoverTimeOut = setTimeout(()=>{
            ifHover.value = false
        },waitTime)
    }

    
    const hoverStyle = computed(() => {
        if (!mainRef.value) return {};

        const triggerRect = mainRef.value.getBoundingClientRect();

        let top = 0;
        let left = 0;

        switch (hoverPosition) {
            case 'top':
            top = triggerRect.top - (hoverRef.value?.offsetHeight || 0) - offset;
            left = triggerRect.left + triggerRect.width / 2;
            break;
            case 'bottom':
            top = triggerRect.bottom + offset;
            left = triggerRect.left + triggerRect.width / 2;
            break;
            case 'left':
            top = triggerRect.top;
            left = triggerRect.left - (hoverRef.value?.offsetWidth || 0) - offset;
            break;
            case 'right':
            top = triggerRect.top;
            left = triggerRect.right + offset;
            break;
            // 更多位置处理...
        }

        return {
            top: `${top}px`,
            left: `${left}px`,
            maxWidth: `${maxWidth}px`
        };
    });
</script>

<style scoped lang='scss'>
.hoverShow{
    position: relative;
    overflow: visible;
    .hoverMain{
        height: fit-content;
    }
}
.hover{
    width: fit-content;
    position: absolute;
    z-index: 1000;
}
</style>