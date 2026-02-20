<template>
    <div class="game-event-container">
        <!-- 自定义组件渲染 -->
        <component
            v-if="gameEvent.component"
            :is="gameEvent.component"
            :event="gameEvent"
        />

        <!-- 选择型事件渲染 -->
        <ChoiceContainer
            v-else-if="isChoiceEvent"
            :choice-group="(gameEvent as ChoiceEvent).getChoiceGroup()"
            @completed="handleEventCompleted"
        />

        <!-- 默认渲染 -->
        <div v-else class="event-default">
            <h2>{{ gameEvent.getDisplayTitle() }}</h2>
            <p>{{ gameEvent.getDisplayDescription() }}</p>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { GameEvent, ChoiceEvent } from '@/core/objects/system/GameEvent'
import ChoiceContainer from '@/ui/components/system/ChoiceContainer.vue'

const props = defineProps<{
    gameEvent: GameEvent
}>()

const emit = defineEmits<{
    completed: []
}>()

/**
 * 判断是否为选择型事件
 */
const isChoiceEvent = computed(() => {
    return props.gameEvent instanceof ChoiceEvent
})

/**
 * 处理事件完成
 */
function handleEventCompleted() {
    emit('completed')
}
</script>

<style scoped lang='scss'>
.game-event-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.event-default {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;

    h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.2rem;
        color: #666;
    }
}
</style>
