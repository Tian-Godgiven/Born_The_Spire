<template>
    <button class="leave-button" @click="$emit('leave')">
        <slot>离开</slot>
    </button>
</template>

<script setup lang="ts">
defineEmits<{
    leave: []
}>()
</script>

<style scoped lang="scss">
.leave-button {
    position: absolute;
    right: var(--layout-leave-right);
    bottom: var(--layout-leave-bottom);
    padding: var(--layout-leave-pad);
    font-size: var(--layout-leave-font);
    font-weight: bold;
    background: white;
    border: 2px solid black;
    cursor: pointer;
    z-index: 10;
    white-space: nowrap;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}
</style>
