<template>
<div class="test-card-panel">
    <div class="panel-header">
        <h3>测试卡牌面板</h3>
        <div class="header-buttons">
            <button @click="clearDrawPile" class="clear-btn">清空抽牌堆</button>
            <button @click="$emit('close')" class="close-btn">×</button>
        </div>
    </div>
    <div class="card-list">
        <div
            v-for="cardMap in cardList"
            :key="cardMap.key"
            @click="addCardToDrawPile(cardMap.key)"
            class="card-item"
        >
            <div class="card-label">{{ cardMap.label }}</div>
            <div class="card-info">
                <span v-if="cardMap.status.cost !== null">费用: {{ cardMap.status.cost }}</span>
                <span v-if="cardMap.status.damage">伤害: {{ cardMap.status.damage }}</span>
            </div>
            <div v-if="cardMap.entry" class="card-entries">
                <span v-for="entry in cardMap.entry" :key="entry" class="entry-tag">
                    {{ getEntryLabel(entry) }}
                </span>
            </div>
            <div>{{ getDescribe(cardMap?.describe) }}</div>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { getAllCards } from '@/static/list/item/cardList'
import { getCardByKey } from '@/static/list/item/cardList'
import { nowPlayer } from '@/core/objects/game/run'
import { entryMap } from '@/static/list/system/entryMap'
import { getDescribe } from '../hooks/express/describe'

// 定义 emit
defineEmits<{
    close: []
}>()

// 获取所有卡牌
const cardList = getAllCards()

// 获取词条标签
function getEntryLabel(entryKey: string): string {
    return entryMap[entryKey]?.label || entryKey
}

// 添加卡牌到抽牌堆
function addCardToDrawPile(cardKey: string) {
    const card = getCardByKey(cardKey)

    // 设置卡牌的 owner
    card.owner = nowPlayer

    // 词条效果由 CardModifier 自动处理，无需手动添加

    // 添加到抽牌堆
    nowPlayer.cardPiles.drawPile.push(card)

    console.log(`添加了 ${card.label} 到抽牌堆`)
}

// 清空抽牌堆
function clearDrawPile() {
    nowPlayer.cardPiles.drawPile.length = 0
    console.log('已清空抽牌堆')
}
</script>

<style scoped lang='scss'>
.test-card-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    height: 80vh;
    background: white;
    border: 2px solid black;
    padding: 10px;
    overflow-y: auto;
    z-index: 1000;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 2px solid black;

    h3 {
        margin: 0;
        font-size: 16px;
    }

    .header-buttons {
        display: flex;
        gap: 8px;
    }
}

.clear-btn, .close-btn {
    padding: 5px 10px;
    background: white;
    border: 2px solid black;
    cursor: pointer;
    font-size: 12px;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}

.close-btn {
    font-size: 18px;
    padding: 2px 8px;
    line-height: 1;
}

.card-list {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    flex-direction: column;
    gap: 5px;

}

.card-item {
    padding: 8px;
    border: 2px solid black;
    cursor: pointer;
    background: white;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &:active {
        background: rgba(0, 0, 0, 0.1);
    }
}

.card-label {
    font-weight: bold;
    margin-bottom: 4px;
}

.card-info {
    font-size: 12px;
    color: #666;
    display: flex;
    gap: 10px;
}

.card-entries {
    margin-top: 4px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.entry-tag {
    font-size: 10px;
    padding: 2px 6px;
    border: 1px solid black;
    background: rgba(0, 0, 0, 0.05);
}
</style>
