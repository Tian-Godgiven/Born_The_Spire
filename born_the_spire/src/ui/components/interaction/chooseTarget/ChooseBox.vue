<template>
<div class="chooseBox" :class="{
    hovering: chooseState.isHovered,
    selectable: chooseState.isSelectable,
    selected: chooseState.isSelected,}"></div>
</template>

<script setup lang='ts'>
    import { TargetChooseState } from '@/ui/interaction/target/targetManager';
    const {chooseState} = defineProps<{chooseState:TargetChooseState}>()
</script>

<style scoped lang='scss'>
.chooseBox{
    left: 50%;
    top: 50%;
    position: absolute;
    transform: translate(-50%,-50%);
    outline-offset: 5px;
    border-radius: 1px;
    &.selectable{
        outline: 2px dashed rgb(184, 184, 184);
        &.hovering{
            outline: 2px solid rgb(184, 184, 184);
        }
        &.selected{
            outline: 2px solid black;
            &.hovering{
                outline: 2px solid black;
            }
        }
    }
}
</style>