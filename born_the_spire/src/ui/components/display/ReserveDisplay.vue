<template>
<div class="reserve-display">
    <div class="reserve-main" @click="togglePopover">
        <span>{{ goldLabel }}：{{ goldAmount }}</span>
        <span v-if="hasOtherReserves" class="indicator">[+]</span>
    </div>

    <!-- 储备详情弹窗 -->
    <div v-if="showPopover" class="reserve-popover">
        <div class="popover-header">
            <div>所有储备</div>
            <button @click="closePopover">×</button>
        </div>
        <div class="popover-content">
            <div v-for="[key, value] in allReserves" :key="key" class="reserve-item">
                <span>{{ getReserveLabel(key) }}：</span>
                <span>{{ value }}</span>
            </div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import { getReserveLabelByKey } from '@/static/list/item/reserveList'
import type { Player } from '@/core/objects/target/Player'

const props = defineProps<{
    player: Player
}>()

// 获取金币数量
const goldAmount = computed(() => {
    return getReserveModifier(props.player).getReserve("gold")
})

// 获取金币的显示名称
const goldLabel = computed(() => {
    return getReserveLabelByKey("gold")
})

// 获取所有储备
const allReserves = computed(() => {
    return getReserveModifier(props.player).getAllReserves()
})

// 是否有其他储备（除了 gold）
const hasOtherReserves = computed(() => {
    return allReserves.value.size > 1
})

// 弹窗显示状态
const showPopover = ref(false)

// 切换弹窗
function togglePopover() {
    if (hasOtherReserves.value) {
        showPopover.value = !showPopover.value
    }
}

// 关闭弹窗
function closePopover() {
    showPopover.value = false
}

// 获取储备的显示名称
function getReserveLabel(key: string): string {
    return getReserveLabelByKey(key)
}
</script>

<style scoped lang="scss">
.reserve-display {
    position: relative;
}

.reserve-main {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .indicator {
        color: #666;
        font-size: 0.9em;
    }

    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
}

.reserve-popover {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    border: 2px solid black;
    padding: 8px;
    min-width: 200px;
    z-index: 1000;

    .popover-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #ccc;

        button {
            background: none;
            border: none;
            font-size: 1.5em;
            cursor: pointer;
            padding: 0 4px;

            &:hover {
                color: red;
            }
        }
    }

    .popover-content {
        .reserve-item {
            padding: 4px 0;
            display: flex;
            justify-content: space-between;

            &:not(:last-child) {
                border-bottom: 1px solid #eee;
            }
        }
    }
}
</style>
