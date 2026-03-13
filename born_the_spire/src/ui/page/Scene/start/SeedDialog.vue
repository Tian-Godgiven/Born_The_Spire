<template>
<div class="seed-dialog-overlay" @click.self="close">
    <div class="seed-dialog">
        <div class="dialog-title">输入种子</div>
        <input
            v-model="inputSeed"
            type="text"
            class="seed-input"
            placeholder="留空则使用随机种子"
            @keyup.enter="confirm"
        />
        <div class="dialog-hint">输入相同的种子可以重复体验相同的地图</div>
        <div class="dialog-actions">
            <button class="btn" @click="close">取消</button>
            <button class="btn primary" @click="confirm">确认</button>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'

const props = defineProps<{
    seed: string
}>()

const emit = defineEmits<{
    'update:seed': [value: string]
    close: []
}>()

const inputSeed = ref('')

onMounted(() => {
    inputSeed.value = props.seed
})

function confirm() {
    emit('update:seed', inputSeed.value.trim())
    emit('close')
}

function close() {
    emit('close')
}
</script>

<style scoped lang='scss'>
.seed-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.seed-dialog {
    background: #fff;
    border: 2px solid #000;
    padding: 30px;
    min-width: 300px;
}

.dialog-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
}

.seed-input {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border: 2px solid #000;
    box-sizing: border-box;
    margin-bottom: 10px;

    &:focus {
        outline: none;
    }
}

.dialog-hint {
    font-size: 12px;
    color: #666;
    margin-bottom: 20px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn {
    padding: 10px 20px;
    border: 2px solid #000;
    background: #fff;
    cursor: pointer;
    font-size: 14px;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.primary {
        background: #333;
        color: #fff;

        &:hover {
            background: #444;
        }
    }
}
</style>
