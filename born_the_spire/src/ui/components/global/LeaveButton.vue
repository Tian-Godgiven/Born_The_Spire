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
    position: fixed;
    right: 15%;
    top: 75%;
    transform: translateY(-50%);
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    background: white;
    border: 2px solid black;
    cursor: pointer;
    transition: background 0.2s;
    z-index: 10;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}
</style>
