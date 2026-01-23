<template>
<div class="blackstore-room">
    <div class="blackstore-content">
        <!-- 黑市标题 -->
        <div class="blackstore-header">
            <h1 class="blackstore-title">{{ storeTitle }}</h1>
        </div>

        <!-- 黑市描述 -->
        <div class="blackstore-description">
            <p>一个进行着可疑交易的窝点...</p>
        </div>

        <!-- 器官商品 -->
        <div v-if="organItems.length > 0" class="store-category">
            <h2 class="section-title">器官</h2>
            <div class="items-grid">
                <div
                    v-for="item in organItems"
                    :key="item.id"
                    class="store-item"
                    :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                    @click="handlePurchase(item)"
                >
                    <div class="item-header">
                        <span class="item-price">{{ item.price }} 金</span>
                    </div>
                    <div class="item-name">{{ item.name }}</div>
                    <div v-if="item.description" class="item-description">{{ item.description }}</div>
                    <div v-if="item.isPurchased" class="item-sold">已售出</div>
                </div>
            </div>
        </div>

        <!-- 遗物商品 -->
        <div v-if="relicItems.length > 0" class="store-category">
            <h2 class="section-title">遗物</h2>
            <div class="items-grid">
                <div
                    v-for="item in relicItems"
                    :key="item.id"
                    class="store-item"
                    :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                    @click="handlePurchase(item)"
                >
                    <div class="item-header">
                        <span class="item-price">{{ item.price }} 金</span>
                    </div>
                    <div class="item-name">{{ item.name }}</div>
                    <div v-if="item.description" class="item-description">{{ item.description }}</div>
                    <div v-if="item.isPurchased" class="item-sold">已售出</div>
                </div>
            </div>
        </div>

        <!-- 药水商品 -->
        <div v-if="potionItems.length > 0" class="store-category">
            <h2 class="section-title">药水</h2>
            <div class="items-grid">
                <div
                    v-for="item in potionItems"
                    :key="item.id"
                    class="store-item"
                    :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased }"
                    @click="handlePurchase(item)"
                >
                    <div class="item-header">
                        <span class="item-price">{{ item.price }} 金</span>
                    </div>
                    <div class="item-name">{{ item.name }}</div>
                    <div v-if="item.description" class="item-description">{{ item.description }}</div>
                    <div v-if="item.isPurchased" class="item-sold">已售出</div>
                </div>
            </div>
        </div>

        <!-- 出售区域 -->
        <div class="sell-section">
            <h2 class="section-title">出售</h2>

            <!-- 出售器官 -->
            <div v-if="allowSellOrgan" class="sell-option" @click="handleSellOrgan">
                <div class="sell-title">出售器官</div>
                <div class="sell-description">出售你的器官以换取金钱（售价约为购买价的 50-70%）</div>
            </div>

            <!-- 出售生命值 -->
            <div v-if="allowSellHealth" class="sell-option" @click="handleSellHealth">
                <div class="sell-title">出售生命值</div>
                <div class="sell-description">
                    出售生命值以换取金钱（当前价格: {{ healthSellPrice }} 金/10生命）
                    <span v-if="healthSoldCount > 0" class="depreciation-note">
                        （已售出 {{ healthSoldCount }} 次，价格已贬值）
                    </span>
                </div>
            </div>
        </div>

        <!-- 离开按钮 -->
        <div class="leave-button" @click="handleLeave">
            离开黑市
        </div>
    </div>

    <!-- 出售器官弹窗 -->
    <div v-if="showSellOrganModal" class="modal-overlay" @click="closeSellOrganModal">
        <div class="modal-content" @click.stop>
            <h2 class="modal-title">选择要出售的器官</h2>
            <div class="organ-list">
                <div
                    v-for="organ in playerOrgans"
                    :key="organ.__key"
                    class="organ-item"
                    @click="confirmSellOrgan(organ)"
                >
                    <div class="organ-name">{{ organ.label }}</div>
                    <div class="organ-sell-price">售价: {{ getOrganSellPrice(organ) }} 金</div>
                </div>
            </div>
            <div class="modal-close" @click="closeSellOrganModal">取消</div>
        </div>
    </div>
</div>
</template>

<script setup lang='ts'>
import { computed, ref } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { BlackStoreRoom, StoreItem } from '@/core/objects/room/BlackStoreRoom'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import { getOrganModifier } from '@/core/objects/system/modifier/OrganModifier'
import { Organ } from '@/core/objects/target/Organ'
import { newLog } from '@/ui/hooks/global/log'

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof BlackStoreRoom) {
        return room
    }
    return null
})

// 黑市标题
const storeTitle = computed(() => {
    return currentRoom.value?.getDisplayName() || '黑市'
})

// 玩家金钱
const playerGold = computed(() => {
    const reserveModifier = getReserveModifier(nowPlayer)
    return reserveModifier.getReserve('gold')
})

// 所有商品列表
const allItems = computed(() => {
    return currentRoom.value?.getStoreItems() || []
})

// 器官商品
const organItems = computed(() => {
    return allItems.value.filter(item => item.type === 'organ')
})

// 遗物商品
const relicItems = computed(() => {
    return allItems.value.filter(item => item.type === 'relic')
})

// 药水商品
const potionItems = computed(() => {
    return allItems.value.filter(item => item.type === 'potion')
})

// 是否允许出售器官
const allowSellOrgan = computed(() => {
    return currentRoom.value?.allowSellOrgan ?? false
})

// 是否允许出售生命值
const allowSellHealth = computed(() => {
    return currentRoom.value?.allowSellHealth ?? false
})

// 生命值售价预览
const healthSellPrice = computed(() => {
    return currentRoom.value?.getHealthSellPricePreview(10) || 0
})

// 生命值售出次数
const healthSoldCount = computed(() => {
    return currentRoom.value?.getHealthSoldCount() || 0
})

// 出售器官弹窗状态
const showSellOrganModal = ref(false)

// 玩家器官列表
const playerOrgans = computed(() => {
    const organModifier = getOrganModifier(nowPlayer)
    return organModifier.getOrgans()
})

// 检查是否能购买
function canAfford(item: StoreItem): boolean {
    return playerGold.value >= item.price && !item.isPurchased
}

// 购买商品
async function handlePurchase(item: StoreItem) {
    if (!currentRoom.value) return
    if (item.isPurchased) {
        newLog(['该商品已售出！'])
        return
    }
    if (!canAfford(item)) {
        newLog(['金钱不足！'])
        return
    }

    await currentRoom.value.purchaseItem(item.id)
}

// 打开出售器官弹窗
async function handleSellOrgan() {
    if (!currentRoom.value) return

    if (playerOrgans.value.length === 0) {
        newLog(['你没有可以出售的器官'])
        return
    }

    showSellOrganModal.value = true
}

// 关闭出售器官弹窗
function closeSellOrganModal() {
    showSellOrganModal.value = false
}

// 确认出售器官
async function confirmSellOrgan(organ: Organ) {
    if (!currentRoom.value) return

    await currentRoom.value.sellOrgan(organ)
    closeSellOrganModal()
}

// 获取器官售价
function getOrganSellPrice(organ: Organ): number {
    if (!currentRoom.value) return 0

    // 使用私有方法的逻辑计算售价
    const organData = organ as any
    const baseBuyPrice = currentRoom.value['calculateOrganPrice'](organData)
    const sellRatio = 0.5 + Math.random() * 0.2
    return Math.floor(baseBuyPrice * sellRatio)
}

// 出售生命值
async function handleSellHealth() {
    if (!currentRoom.value) return

    // TODO: 打开生命值数量选择界面
    // 暂时固定出售 10 点生命值
    await currentRoom.value.sellHealth(10)
}

// 离开黑市
async function handleLeave() {
    if (!currentRoom.value) return
    await currentRoom.value.complete()
}
</script>

<style scoped lang='scss'>
.blackstore-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    padding: 2rem;
    background: white;
    overflow-y: auto;
}

.blackstore-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.blackstore-header {
    text-align: center;
    border-bottom: 2px solid black;
    padding-bottom: 1rem;
}

.blackstore-title {
    font-size: 2.5rem;
    margin: 0;
    font-weight: bold;
}

.blackstore-description {
    text-align: center;
    padding: 1rem 2rem;
    border: 2px solid black;
    background: white;
}

.blackstore-description p {
    font-size: 1.2rem;
    margin: 0;
}

.store-category {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-title {
    font-size: 1.8rem;
    margin: 0 0 1rem 0;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
}

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.store-item {
    border: 2px solid black;
    padding: 1rem;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;

    &:hover:not(.sold) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.can-afford {
        border-color: green;
    }

    &.sold {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.item-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.item-price {
    font-weight: bold;
}

.item-name {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.item-description {
    font-size: 0.9rem;
    color: #666;
}

.item-sold {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    font-weight: bold;
    color: red;
    opacity: 0.7;
}

.sell-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.sell-option {
    border: 2px solid black;
    padding: 1.5rem;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.sell-title {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.sell-description {
    font-size: 1rem;
    color: #666;
}

.depreciation-note {
    color: red;
    font-weight: bold;
}

.leave-button {
    border: 2px solid black;
    padding: 1rem 2rem;
    background: white;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

// 弹窗样式
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border: 2px solid black;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-title {
    font-size: 1.8rem;
    margin: 0 0 1.5rem 0;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
}

.organ-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.organ-item {
    border: 2px solid black;
    padding: 1rem;
    background: white;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.organ-name {
    font-size: 1.2rem;
    font-weight: bold;
}

.organ-sell-price {
    font-size: 1rem;
    color: green;
    font-weight: bold;
}

.modal-close {
    border: 2px solid black;
    padding: 0.8rem 1.5rem;
    background: white;
    text-align: center;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
