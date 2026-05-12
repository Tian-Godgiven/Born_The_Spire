<template>
    <Transition name="fade">
        <div v-if="visible" class="turn-display">
            <div class="turn-display-content">
                {{ displayText }}
            </div>
        </div>
    </Transition>
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue'
import { useDisplayMessage } from '@/ui/hooks/global/displayMessage'

const { currentMessage, clearDisplayMessage } = useDisplayMessage()

const visible = ref(false)
const displayText = ref('')

// 监听全局消息变化
watch(currentMessage, (newMessage) => {
    if (newMessage) {
        displayText.value = newMessage.message
        visible.value = true

        // 显示指定时长后自动隐藏
        setTimeout(() => {
            visible.value = false
            clearDisplayMessage()
        }, newMessage.duration || 3000)
    }
})
</script>

<style scoped lang='scss'>
.turn-display {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
}

.turn-display-content {
    padding: 40px 80px;
    background: white;
    border: 2px solid black;
    font-size: 48px;
    font-weight: bold;
    text-align: center;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
