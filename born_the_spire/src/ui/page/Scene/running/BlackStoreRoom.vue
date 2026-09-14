<template>
<div class="blackstore-room">
    <!-- 标题 -->
    <div class="blackstore-header">
        <h1 class="blackstore-title">{{ storeTitle }}</h1>
        <p class="blackstore-desc">一个进行着可疑交易的窝点...</p>
    </div>

    <div class="blackstore-body">
        <!-- 左侧：金钱 + 出售 -->
        <div class="side-panel">
            <!-- 金钱信息 -->
            <div class="currency-box">
                <div class="currency-title">持有</div>
                <div
                    v-for="[key, value] in allReserves"
                    :key="key"
                    class="currency-row"
                >
                    <span class="currency-label">{{ reserveLabel(key) }}</span>
                    <span class="currency-value">{{ value }}</span>
                </div>
            </div>

            <!-- 出售区域 -->
            <div class="sell-section">
                <div class="sell-title">出售</div>

                <div
                    v-if="allowSellOrgan"
                    class="sell-option"
                    @click="handleSellOrgan"
                >
                    <div class="sell-option-name">出售器官</div>
                    <div class="sell-option-desc">以购入价的 50~70% 出售</div>
                </div>

                <!-- 物质/生命切换出售 -->
                <div v-if="allowSellMaterial || allowSellHealth" class="sell-resource">
                    <div class="sell-toggle" v-if="allowSellMaterial && allowSellHealth">
                        <div
                            class="toggle-option"
                            :class="{ 'active': sellMode === 'material' }"
                            @click="sellMode = 'material'"
                        >物质</div>
                        <div
                            class="toggle-option"
                            :class="{ 'active': sellMode === 'health' }"
                            @click="sellMode = 'health'"
                        >生命</div>
                    </div>

                    <!-- 物质出售 -->
                    <div v-if="sellMode === 'material'" class="sell-preview">
                        <div class="sell-detail">{{ materialSellActualAmount }} 物质 → {{ materialSellPrice }} 金</div>
                        <div class="sell-info">当前物质: {{ playerMaterial }}</div>
                        <div
                            class="sell-button"
                            :class="{ 'disabled': playerMaterial <= 0 }"
                            @click="handleSellMaterial"
                        >出售</div>
                    </div>

                    <!-- 生命出售 -->
                    <div v-if="sellMode === 'health'" class="sell-preview">
                        <div class="sell-detail">10 生命 → {{ healthSellPrice }} 金</div>
                        <div class="sell-info">当前: {{ playerCurrentHealth }} / {{ playerMaxHealth }}</div>
                        <div
                            class="sell-button"
                            :class="{ 'disabled': !canSellHealthNow }"
                            @click="handleSellHealth"
                        >出售</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 右侧：商品区 -->
        <div class="store-panel">
            <!-- 上方：器官（横排一行） -->
            <div v-if="organItems.length > 0" class="store-category">
                <h2 class="section-title">器官</h2>
                <div class="items-row organs-row">
                    <div
                        v-for="item in organItems"
                        :key="item.id"
                        class="store-item"
                        :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased, 'selected': isSelected(item) }"
                        @click="selectStoreItem(item, $event)"
                    >
                        <div class="item-headline">
                            <div class="item-name">{{ item.name }}</div>
                            <div
                                v-if="item.rarity"
                                class="item-rarity"
                                :style="{ color: rarityColor(item.rarity) }"
                            >{{ rarityLabel(item.rarity) }}</div>
                        </div>
                        <div class="item-price">{{ item.price }} 金</div>
                        <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                    </div>
                </div>
            </div>

            <!-- 下方：左卡牌 / 右遗物+药水 -->
            <div class="store-bottom">
                <!-- 下左：卡牌 -->
                <div v-if="cardItems.length > 0" class="store-category store-bottom-left">
                    <h2 class="section-title">卡牌</h2>
                    <div class="items-col">
                        <div
                            v-for="item in cardItems"
                            :key="item.id"
                            class="store-item"
                            :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased, 'selected': isSelected(item) }"
                            @click="selectStoreItem(item, $event)"
                        >
                            <div class="item-headline">
                                <div class="item-name">{{ item.name }}</div>
                                <div
                                    v-if="item.rarity"
                                    class="item-rarity"
                                    :style="{ color: rarityColor(item.rarity) }"
                                >{{ rarityLabel(item.rarity) }}</div>
                            </div>
                            <div class="item-price">{{ item.price }} 金</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                </div>

                <!-- 下右：遗物 + 药水 -->
                <div class="store-bottom-right">
                    <div v-if="relicItems.length > 0" class="store-category">
                        <h2 class="section-title">遗物</h2>
                        <div class="items-row">
                            <div
                                v-for="item in relicItems"
                                :key="item.id"
                            class="store-item"
                            :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased, 'selected': isSelected(item) }"
                            @click="selectStoreItem(item, $event)"
                        >
                            <div class="item-headline">
                                <div class="item-name">{{ item.name }}</div>
                                <div
                                    v-if="item.rarity"
                                    class="item-rarity"
                                    :style="{ color: rarityColor(item.rarity) }"
                                >{{ rarityLabel(item.rarity) }}</div>
                            </div>
                            <div class="item-price">{{ item.price }} 金</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                    </div>

                    <div v-if="potionItems.length > 0" class="store-category">
                        <h2 class="section-title">药水</h2>
                        <div class="items-row">
                            <div
                                v-for="item in potionItems"
                                :key="item.id"
                            class="store-item"
                            :class="{ 'can-afford': canAfford(item), 'sold': item.isPurchased, 'selected': isSelected(item) }"
                            @click="selectStoreItem(item, $event)"
                        >
                            <div class="item-headline">
                                <div class="item-name">{{ item.name }}</div>
                                <div
                                    v-if="item.rarity"
                                    class="item-rarity"
                                    :style="{ color: rarityColor(item.rarity) }"
                                >{{ rarityLabel(item.rarity) }}</div>
                            </div>
                            <div class="item-price">{{ item.price }} 金</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 商品详情：点选后弹出，四组商品共用一个浮层 -->
    <Popover
        inline
        trigger="manual"
        :show="!!selectedItem"
        :anchor="tooltipAnchor"
        placement="bottom"
        align="start"
        :max-width="600"
    >
        <template #content>
        <div
            v-if="selectedItem"
            class="store-tooltip"
        >
            <!-- 器官详情 -->
            <OrganHoverContent
                v-if="selectedItem.type === 'organ' && getPreview(selectedItem.id)"
                :organ="getPreview(selectedItem.id)"
            />
            <!-- 遗物详情 -->
            <RelicHoverContent
                v-else-if="selectedItem.type === 'relic' && getPreview(selectedItem.id)"
                :relic="getPreview(selectedItem.id)"
            />
            <!-- 卡牌详情 -->
            <Card
                v-if="selectedItem.type === 'card' && getPreview(selectedItem.id)"
                :card="getPreview(selectedItem.id)"
            />
            <!-- 药水详情 -->
            <div
                v-if="selectedItem.type === 'potion' && getPreview(selectedItem.id)"
                class="potion-tooltip"
            >
                <div class="potion-tooltip-name">{{ getPreview(selectedItem.id).label }}</div>
                <div class="potion-tooltip-desc">{{ getPotionDesc(selectedItem.id) }}</div>
            </div>
        </div>
        </template>
    </Popover>

    <!-- 离开按钮 -->
    <LeaveButton @leave="handleLeave">离开黑市</LeaveButton>

    <button
        v-if="selectedItem"
        type="button"
        class="store-buy-button"
        :style="{ zIndex: ROOM_ACTION_Z_INDEX }"
        @click="confirmPurchase"
    >购买 {{ selectedItem.price }} 金</button>

    <!-- 出售器官弹窗 -->
    <div v-if="showSellOrganModal" class="modal-overlay" @click="closeSellOrganModal">
        <div class="modal-content" @click.stop>
            <h2 class="modal-title">选择要出售的器官</h2>
            <div class="organ-list">
                <div
                    v-for="info in sellableOrgans"
                    :key="info.organ.key"
                    class="organ-item"
                    @click="confirmSellOrgan(info.organ)"
                >
                    <div class="organ-name">{{ info.organ.label }}</div>
                    <div class="organ-sell-price">{{ info.sellPrice }} 金 ({{ info.discountPercent }})</div>
                </div>
                <div v-if="sellableOrgans.length === 0" class="empty-hint">没有可出售的器官</div>
            </div>
            <div class="modal-close" @click="closeSellOrganModal">取消</div>
        </div>
    </div>

</div>
</template>

<script setup lang='ts'>
import { computed, ref } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { BlackStoreRoom } from '@/core/objects/room/BlackStoreRoom'
import type { StoreItem } from '@/core/objects/room/BlackStoreRoom'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import type { Organ } from '@/core/objects/target/Organ'
import { newLog } from '@/ui/hooks/global/log'
import { showDisplayMessage } from '@/ui/hooks/global/displayMessage'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'
import { openMapToLeave } from '@/core/hooks/step'
import { getDescribe } from '@/ui/hooks/express/describe'
import LeaveButton from '@/ui/components/global/LeaveButton.vue'
import OrganHoverContent from '@/ui/components/interaction/OrganHoverContent.vue'
import RelicHoverContent from '@/ui/components/interaction/RelicHoverContent.vue'
import Card from '@/ui/components/object/Card.vue'
import Popover from '@/ui/components/global/Popover.vue'
import { getRarityColor, getRarityLabel } from '@/static/list/system/rarityPalette'
import { ROOM_ACTION_Z_INDEX } from '@/ui/hooks/interaction/popoverHost'

// 金钱类型显示名映射
const RESERVE_LABELS: Record<string, string> = {
    gold: '金币',
}

function reserveLabel(key: string): string {
    return RESERVE_LABELS[key] ?? key
}

// 获取当前房间
const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof BlackStoreRoom) return room
    return null
})

const storeTitle = computed(() => currentRoom.value?.getDisplayName() || '黑市')

function rarityLabel(rarity: string): string {
    return getRarityLabel(rarity)
}

function rarityColor(rarity: string): string {
    return getRarityColor(rarity)
}

// 金钱
const allReserves = computed(() => {
    const reserveModifier = getReserveModifier(nowPlayer)
    return [...reserveModifier.getAllReserves()].filter(([key]) => key !== 'soul')
})

// 商品
const allItems = computed(() => currentRoom.value?.getStoreItems() || [])
const organItems = computed(() => allItems.value.filter(i => i.type === 'organ'))
const relicItems = computed(() => allItems.value.filter(i => i.type === 'relic'))
const potionItems = computed(() => allItems.value.filter(i => i.type === 'potion'))
const cardItems = computed(() => allItems.value.filter(i => i.type === 'card'))

// 出售相关
const allowSellOrgan = computed(() => currentRoom.value?.allowSellOrgan ?? false)
const allowSellMaterial = computed(() => currentRoom.value?.allowSellMaterial ?? false)
const allowSellHealth = computed(() => currentRoom.value?.allowSellHealth ?? false)

// 可出售器官（带折扣信息）
const sellableOrgans = computed(() => currentRoom.value?.getSellableOrgans() || [])

// 玩家生命值
const playerCurrentHealth = computed(() => getCurrentValue(nowPlayer, 'health'))
const playerMaxHealth = computed(() => getStatusValue(nowPlayer, 'max-health'))

// 玩家物质
const playerMaterial = computed(() => {
    const reserveModifier = getReserveModifier(nowPlayer)
    return reserveModifier.getReserve('material')
})

// 切换模式：物质 or 生命
const sellMode = ref<'material' | 'health'>(
    allowSellMaterial.value ? 'material' : 'health'
)

// 物质出售预览
const materialSellActualAmount = computed(() => currentRoom.value?.getMaterialSellActualAmount() || 0)
const materialSellPrice = computed(() => currentRoom.value?.getMaterialSellPricePreview() || 0)

// 生命出售预览
const healthSellPrice = computed(() => currentRoom.value?.getHealthSellPricePreview() || 0)
const canSellHealthNow = computed(() => currentRoom.value?.canSellHealth() ?? false)

// 弹窗状态
const showSellOrganModal = ref(false)

// === 商品详情：点选后弹出 ===
const selectedItem = ref<StoreItem | null>(null)
const tooltipAnchor = ref<HTMLElement | null>(null)

function getPreview(itemId: string): any {
    return currentRoom.value?.getPreviewInstance(itemId) ?? null
}

function getPotionDesc(itemId: string): string {
    const instance = getPreview(itemId)
    if (!instance || !instance.describe) return ''
    return getDescribe(instance.describe, instance)
}

function isSelected(item: StoreItem): boolean {
    return selectedItem.value?.id === item.id
}

function clearSelection() {
    selectedItem.value = null
    tooltipAnchor.value = null
}

function selectStoreItem(item: StoreItem, event: MouseEvent) {
    if (item.isPurchased) return
    if (isSelected(item)) {
        clearSelection()
        return
    }
    selectedItem.value = item
    tooltipAnchor.value = event.currentTarget as HTMLElement
}

// === 购买 ===
function canAfford(item: StoreItem): boolean {
    const reserveModifier = getReserveModifier(nowPlayer)
    return reserveModifier.getReserve('gold') >= item.price && !item.isPurchased
}

// 黑市老板的嘲讽语录（买不起时随机选一条）
const cantAffordLines = [
    '滚。',
    '？',
    '别。碰。',
    '啊！？',
    '(厌恶的咋舌声)',
    '命，换，钱。',
]

async function confirmPurchase() {
    const item = selectedItem.value
    if (!currentRoom.value || !item) return
    if (item.isPurchased) {
        newLog(['该商品已售出'])
        clearSelection()
        return
    }
    if (!canAfford(item)) {
        const line = cantAffordLines[Math.floor(Math.random() * cantAffordLines.length)]
        showDisplayMessage(`"${line}"`, 2000)
        return
    }
    await currentRoom.value.purchaseItem(item.id)
    clearSelection()
}

// === 出售器官 ===
function handleSellOrgan() {
    showSellOrganModal.value = true
}

function closeSellOrganModal() {
    showSellOrganModal.value = false
}

async function confirmSellOrgan(organ: Organ) {
    if (!currentRoom.value) return
    await currentRoom.value.sellOrgan(organ)
    closeSellOrganModal()
}

// === 出售物质 ===
async function handleSellMaterial() {
    if (!currentRoom.value) return
    if (playerMaterial.value <= 0) {
        showDisplayMessage('"没有物质可卖。"', 2000)
        return
    }
    await currentRoom.value.sellMaterial()
}

// === 出售生命值 ===
async function handleSellHealth() {
    if (!currentRoom.value) return
    if (!canSellHealthNow.value) {
        showDisplayMessage('"生命值不足。"', 2000)
        return
    }
    await currentRoom.value.sellHealth()
}

// === 离开 ===
async function handleLeave() {
    if (!currentRoom.value) return
    await openMapToLeave()
}
</script>

<style scoped lang='scss'>
.blackstore-room {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    overflow-y: auto;
}

// 标题
.blackstore-header {
    text-align: center;
    padding: 0.6rem 1.2rem 0.5rem;
    border-bottom: 2px solid black;
}

.blackstore-title {
    font-size: 1.5rem;
    margin: 0;
    font-weight: bold;
}

.blackstore-desc {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: #666;
}

// 主体：左右分栏
.blackstore-body {
    display: flex;
    flex: 1;
    min-height: 0;
}

// 左侧面板
.side-panel {
    width: 200px;
    flex-shrink: 0;
    border-right: 2px solid black;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

// 金钱信息
.currency-box {
    border: 2px solid black;
    padding: 0.8rem;
}

.currency-title {
    font-weight: bold;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3rem;
}

.currency-row {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0;
    font-size: 0.9rem;
}

.currency-label {
    color: #666;
}

.currency-value {
    font-weight: bold;
}

// 出售区域
.sell-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.sell-title {
    font-weight: bold;
    font-size: 1rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3rem;
}

.sell-option {
    border: 2px solid black;
    padding: 0.6rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.sell-option-name {
    font-weight: bold;
    font-size: 0.9rem;
}

.sell-option-desc {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.2rem;
}

.depreciation-note {
    color: red;
    font-weight: bold;
}

// 物质/生命切换出售
.sell-resource {
    border: 2px solid black;
    padding: 0.6rem;
}

.sell-toggle {
    display: flex;
    border: 2px solid black;
    margin-bottom: 0.5rem;
}

.toggle-option {
    flex: 1;
    text-align: center;
    padding: 0.3rem 0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.active {
        background: black;
        color: white;
    }
}

.sell-preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.sell-detail {
    font-weight: bold;
    font-size: 0.9rem;
}

.sell-info {
    font-size: 0.75rem;
    color: #888;
}

.sell-button {
    border: 2px solid black;
    text-align: center;
    padding: 0.3rem;
    margin-top: 0.2rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

// 右侧商品区
.store-panel {
    flex: 1;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
}

.store-category {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.section-title {
    font-size: 1.2rem;
    margin: 0;
    border-bottom: 2px solid black;
    padding-bottom: 0.3rem;
}

// 下方分栏
.store-bottom {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
}

.store-bottom-left {
    flex-shrink: 0;
    min-width: 150px;
}

.store-bottom-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.items-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
}

.organs-row {
    flex-wrap: nowrap;

    .store-item {
        flex: 1;
        min-width: 0;
        max-width: none;
    }
}

.items-col {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.store-item {
    border: 2px solid black;
    padding: 0.8rem;
    min-width: 120px;
    max-width: 180px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;

    &:hover:not(.sold) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.selected:not(.sold) {
        background: black;
        color: white;
    }

    &.can-afford {
        border-color: green;
    }

    &.sold {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.item-headline {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
}

.item-name {
    font-weight: bold;
    font-size: 1rem;
    min-width: 0;
}

.item-rarity {
    flex-shrink: 0;
    font-size: 0.75rem;
}

.item-price {
    font-size: 0.9rem;
    margin-top: 0.3rem;
}

.sold-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    font-weight: bold;
    color: red;
}

.store-buy-button {
    position: absolute;
    right: var(--layout-leave-right);
    bottom: var(--layout-leave-bottom);
    padding: var(--layout-store-buy-pad);
    font-size: var(--layout-store-buy-font);
    font-weight: bold;
    background: black;
    color: white;
    border: 2px solid black;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
        background: #222;
    }

    &:active {
        background: #444;
    }
}

// 商品详情 tooltip
.store-tooltip {
    .potion-tooltip {
        background: white;
        border: 2px solid black;
        padding: 12px;
        min-width: 200px;
        max-width: 300px;

        .potion-tooltip-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid #ccc;
        }

        .potion-tooltip-desc {
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
        }
    }
}

// 弹窗
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal-content {
    background: white;
    border: 2px solid black;
    padding: 1.5rem;
    max-width: 500px;
    width: 90%;
    max-height: 70vh;
    overflow-y: auto;
}

.modal-title {
    font-size: 1.4rem;
    margin: 0 0 1rem;
    border-bottom: 2px solid black;
    padding-bottom: 0.5rem;
}

.organ-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.organ-item {
    border: 2px solid black;
    padding: 0.8rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}

.organ-name {
    font-weight: bold;
}

.organ-sell-price {
    color: green;
    font-weight: bold;
    font-size: 0.9rem;
}

.empty-hint {
    text-align: center;
    color: #999;
    padding: 1rem;
}

.health-info {
    margin-bottom: 1rem;
    padding: 0.8rem;
    border: 2px solid black;

    p {
        margin: 0.3rem 0;
        font-size: 1rem;
    }

    .warning-text {
        color: red;
        font-weight: bold;
        font-size: 0.9rem;
    }
}

.health-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.health-option {
    border: 2px solid black;
    padding: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover:not(.disabled) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

.health-amount {
    font-weight: bold;
}

.health-price {
    font-size: 0.9rem;
    color: green;
    font-weight: bold;
}

.modal-close {
    border: 2px solid black;
    padding: 0.6rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }
}
</style>
