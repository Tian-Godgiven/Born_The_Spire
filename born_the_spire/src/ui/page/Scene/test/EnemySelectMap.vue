<template>
<div class="map-container">
    <div class="map-header">
        <h2>选择战斗</h2>
    </div>

    <div class="map-nodes">
        <div
            v-for="(node, index) in mapNodes"
            :key="node.key"
            class="map-node"
            :class="{ 'node-elite': node.type === 'elite', 'node-boss': node.type === 'boss' }"
            @click="selectNode(node)"
            @mouseenter="hoveredNode = node"
            @mouseleave="hoveredNode = null"
        >
            <div class="node-icon">
                {{ node.icon }}
            </div>
            <div class="node-label">{{ node.label }}</div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getEnemyByKey } from '@/static/list/target/enemyList'
import { startNewBattle } from '@/core/objects/game/battle'
import { nowPlayer } from '@/core/objects/game/run'
import { hideMap } from '@/ui/hooks/global/mapDisplay'

// 地图节点数据（简化版）
const mapNodes = [
    { key: 'test_enemy_slime', label: '史莱姆', icon: '●', type: 'normal' },
    { key: 'test_enemy_mage', label: '法师', icon: '●', type: 'normal' },
    { key: 'test_enemy_berserker', label: '狂战士', icon: '◆', type: 'elite' },
    { key: 'test_enemy_elite', label: '双头蛇', icon: '◆', type: 'elite' },
    { key: 'test_enemy_boss', label: '守护者', icon: '★', type: 'boss' }
]

// 当前hover的节点
const hoveredNode = ref<typeof mapNodes[0] | null>(null)

// 选择节点开始战斗
async function selectNode(node: typeof mapNodes[0]) {
    try {
        // 创建敌人
        const enemy = getEnemyByKey(node.key)

        // 开始战斗
        await startNewBattle([nowPlayer], [enemy])

        // 隐藏地图
        hideMap()
    } catch (error) {
        console.error('创建战斗失败:', error)
        alert('创建战斗失败，请查看控制台')
    }
}
</script>

<style scoped lang="scss">
.map-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
    box-sizing: border-box;
    background: white;
}

.map-header {
    margin-bottom: 40px;

    h2 {
        font-size: 28px;
        text-align: center;
    }
}

.map-nodes {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    justify-content: center;
    max-width: 800px;
}

.map-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-4px);
    }

    .node-icon {
        width: 60px;
        height: 60px;
        border: 2px solid black;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        transition: background 0.2s ease;
    }

    .node-label {
        font-size: 14px;
        text-align: center;
    }

    &:hover .node-icon {
        background: rgba(0, 0, 0, 0.05);
    }

    // 精英节点样式
    &.node-elite .node-icon {
        border-color: #d4af37;
        color: #d4af37;
    }

    // Boss节点样式
    &.node-boss .node-icon {
        border-color: #c41e3a;
        color: #c41e3a;
        border-width: 3px;
    }
}
</style>
