<template>
<div v-if="shouldShow" class="default-mechanism-ui">
    <span v-if="config.icon" class="mechanism-icon">{{ config.icon }}</span>
    <span class="mechanism-value">{{ mechanismValue }}</span>
</div>
</template>

<script setup lang='ts'>
import { Entity } from '@/core/objects/system/Entity'
import { MechanismConfig } from '@/core/types/MechanismConfig'
import { computed } from 'vue'

const { entity, config } = defineProps<{
    entity: Entity
    config: MechanismConfig
}>()

// 获取机制存储的键名
const storageKey = computed(() => config.data.key || config.key)

// 获取机制值
const mechanismValue = computed(() => {
    const location = config.data.location

    if (location === "current") {
        return entity.current[storageKey.value]?.value ?? 0
    } else if (location === "status") {
        return entity.status[storageKey.value]?.value ?? 0
    }

    return 0
})

// 是否应该显示
const shouldShow = computed(() => {
    if (config.ui?.showWhen) {
        return config.ui.showWhen(mechanismValue.value, entity)
    }
    return true
})
</script>

<style scoped lang='scss'>
.default-mechanism-ui {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: white;
    border: 2px solid black;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;

    .mechanism-icon {
        font-size: 16px;
        line-height: 1;
    }

    .mechanism-value {
        line-height: 1;
    }
}
</style>
