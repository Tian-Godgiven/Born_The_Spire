<template>
<div v-if="mechanismsToShow.length > 0" class="mechanism-display-container">
    <component
        v-for="mechanism in mechanismsToShow"
        :key="mechanism.key"
        :is="mechanism.component"
        :entity="entity"
        :config="mechanism.config"
    />
</div>
</template>

<script setup lang='ts'>
import { Entity } from '@/core/objects/system/Entity'
import { UIPosition } from '@/core/types/MechanismConfig'
import { getMechanismManager } from '@/core/objects/system/mechanism/MechanismManager'
import { getMechanismConfig } from '@/static/registry/mechanismRegistry'
import DefaultMechanismUI from './DefaultMechanismUI.vue'
import { computed, type Component } from 'vue'

const { entity, position } = defineProps<{
    entity: Entity
    position: UIPosition
}>()

// 获取该位置应该显示的机制
const mechanismsToShow = computed(() => {
    const manager = getMechanismManager(entity)
    const enabledKeys = manager.getEnabledMechanisms()

    const mechanisms: Array<{
        key: string
        config: any
        component: Component | string
    }> = []

    for (const key of enabledKeys) {
        const config = getMechanismConfig(key)
        if (!config || !config.ui) continue

        // 检查位置是否匹配
        if (config.ui.position !== position) continue

        // 确定使用哪个组件
        const component = config.ui.component || DefaultMechanismUI

        mechanisms.push({
            key,
            config,
            component
        })
    }

    return mechanisms
})
</script>

<style scoped lang='scss'>
.mechanism-display-container {
    position: absolute;
    left: 100%;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
</style>
