<template>
<div class="blackstore-room">
    <div class="blackstore-header">
        <div class="title-container">        
            <h1 class="blackstore-title">{{ storeTitle }}</h1>
            <p class="blackstore-desc">一个进行着可疑交易的窝点...</p>
        </div>

        <div v-if="canSellAnything" class="page-tabs">
            <div
                class="page-tab"
                :class="{ active: page === 'buy' }"
                @click="setPage('buy')"
            >购买</div>
            <div
                class="page-tab"
                :class="{ active: page === 'sell' }"
                @click="setPage('sell')"
            >出售</div>
        </div>
    </div>

    <!-- 购买页 -->
    <div v-if="page === 'buy'" class="store-panel">
        <!-- 第一栏：器官 -->
        <div v-if="organItems.length > 0" class="store-category">
            <h2 class="section-title">器官</h2>
            <div class="items-row organs-row">
                <StoreOrganTile
                    v-for="item in organItems"
                    :key="item.id"
                    :organ="getPreview(item.id)"
                    :name="item.name"
                    :price="item.price"
                    :rarity="item.rarity"
                    :selected="isBuySelected(item)"
                    :sold="item.isPurchased"
                    :can-afford="canAfford(item)"
                    @select="selectStoreItem(item, $event)"
                />
            </div>
        </div>

        <!-- 第二栏：卡牌，药水，遗物 -->
        <div class="store-second">
            <div v-if="cardItems.length > 0" class="store-category">
                <h2 class="section-title">卡牌</h2>
                <div class="items-row cards-row">
                    <div
                        v-for="item in cardItems"
                        :key="item.id"
                        class="store-card-slot"
                        :class="{
                            'can-afford': canAfford(item),
                            sold: item.isPurchased,
                            selected: isBuySelected(item)
                        }"
                        @click="selectStoreItem(item, $event)"
                    >
                        <Card v-if="getPreview(item.id)" :card="getPreview(item.id)" />
                        <div class="item-price">{{ item.price }} 金币</div>
                        <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                    </div>
                </div>
            </div>

            
            <!-- 遗物+药水 -->
            <div class="relics_and_potions">
                <div v-if="relicItems.length > 0" class="store-category">
                    <h2 class="section-title">遗物</h2>
                    <div class="items-row goods-row">
                        <div
                            v-for="item in relicItems"
                            :key="item.id"
                            class="store-item"
                            :class="{
                                'can-afford': canAfford(item),
                                sold: item.isPurchased,
                                selected: isBuySelected(item)
                            }"
                            @click="selectStoreItem(item, $event)"
                        >
                            <div class="item-headline">
                                <div class="item-name">{{ item.name }}</div>
                            </div>
                            <div class="item-price">{{ item.price }} 金币</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                </div>
                <div v-if="potionItems.length > 0" class="store-category">
                    <h2 class="section-title">药水</h2>
                    <div class="items-row goods-row">
                        <div
                            v-for="item in potionItems"
                            :key="item.id"
                            class="store-item"
                            :class="{
                                'can-afford': canAfford(item),
                                sold: item.isPurchased,
                                selected: isBuySelected(item)
                            }"
                            @click="selectStoreItem(item, $event)"
                        >
                            <div class="item-headline">
                                <div class="item-name">{{ item.name }}</div>
                            </div>
                            <div class="item-price">{{ item.price }} 金币</div>
                            <div v-if="item.isPurchased" class="sold-overlay">已售出</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- 收购页 -->
    <div v-else class="sell-panel">
        <div v-if="allowSellOrgan" class="store-category">
            <h2 class="section-title">收购器官</h2>
            <div v-if="organSellOffers.length > 0" class="items-row organs-row">
                <StoreOrganTile
                    v-for="offer in organSellOffers"
                    :key="offer.organ.__id ?? offer.organ.key"
                    :organ="offer.organ"
                    :price="offer.sellPrice"
                    :rarity="offer.organ.rarity"
                    :selected="isSellSelected(offer.organ)"
                    :sold="offer.sold"
                    sold-label="已出售"
                    price-right
                    @select="selectSellOrgan(offer.organ, $event)"
                />
            </div>
            <div v-else class="empty-hint">你没有可以出售的器官</div>
        </div>

        <div v-if="allowSellHealth || allowSellMaterial" class="sell-resources">
            <div v-if="allowSellHealth" class="resource-block">
                <div class="resource-title">出售生命</div>
                <div class="sell-detail">10 生命 → {{ healthSellPrice }} 金币</div>
                <div class="sell-info">当前: {{ playerCurrentHealth }} / {{ playerMaxHealth }}</div>
                <div
                    class="sell-button"
                    :class="{ disabled: !canSellHealthNow }"
                    @click="handleSellHealth"
                >出售</div>
            </div>

            <div v-if="allowSellMaterial" class="resource-block">
                <div class="resource-title">出售物质</div>
                <div class="sell-detail">{{ materialSellActualAmount }} 物质 → {{ materialSellPrice }} 金币</div>
                <div class="sell-info">当前物质: {{ playerMaterial }}</div>
                <div
                    class="sell-button"
                    :class="{ disabled: playerMaterial <= 0 }"
                    @click="handleSellMaterial"
                >出售</div>
            </div>
        </div>
    </div>

    <Popover
        inline
        trigger="manual"
        :show="showDetail"
        :anchor="tooltipAnchor"
        placement="bottom"
        align="start"
        :max-width="600"
    >
        <template #content>
        <div v-if="selectedBuyItem" class="store-tooltip">
            <OrganHoverContent
                v-if="selectedBuyItem.type === 'organ' && getPreview(selectedBuyItem.id)"
                :organ="getPreview(selectedBuyItem.id)"
            />
            <RelicHoverContent
                v-else-if="selectedBuyItem.type === 'relic' && getPreview(selectedBuyItem.id)"
                :relic="getPreview(selectedBuyItem.id)"
            />
            <div
                v-if="selectedBuyItem.type === 'potion' && getPreview(selectedBuyItem.id)"
                class="potion-tooltip"
            >
                <div class="potion-tooltip-name">{{ getPreview(selectedBuyItem.id).label }}</div>
                <div class="potion-tooltip-desc">{{ getPotionDesc(selectedBuyItem.id) }}</div>
            </div>
        </div>
        <OrganHoverContent
            v-else-if="selectedSellOrgan"
            :organ="selectedSellOrgan"
        />
        </template>
    </Popover>

    <div
        v-if="!showConfirmModal"
        class="store-actions"
        :style="{ zIndex: ROOM_ACTION_Z_INDEX }"
    >
        <Button
            v-if="page === 'buy' && selectedBuyItem"
            invert
            large
            :label="`购买消耗 ${selectedBuyItem.price} 金币`"
            :click="confirmPurchase"
        />
        <Button
            v-if="page === 'sell' && selectedSellOffer"
            invert
            large
            :label="`出售获得 ${selectedSellOffer.sellPrice} 金币`"
            :click="confirmSell"
        />
        <Button large label="离开黑市" :click="handleLeave" />
    </div>
</div>
</template>

<script setup lang='ts'>
import { computed, ref } from 'vue'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'
import { BlackStoreRoom } from '@/core/objects/room/BlackStoreRoom'
import type { OrganSellOffer, StoreItem } from '@/core/objects/room/BlackStoreRoom'
import { getReserveModifier } from '@/core/objects/system/modifier/ReserveModifier'
import type { Organ } from '@/core/objects/target/Organ'
import { newLog } from '@/ui/hooks/global/log'
import { showDisplayMessage } from '@/ui/hooks/global/displayMessage'
import { getCurrentValue } from '@/core/objects/system/Current/current'
import { getStatusValue } from '@/core/objects/system/status/Status'
import { openMapToLeave } from '@/core/hooks/step'
import { getDescribe } from '@/ui/hooks/express/describe'
import { showConfirm, showConfirmModal } from '@/ui/hooks/interaction/confirmModal'
import Button from '@/ui/components/global/Button.vue'
import OrganHoverContent from '@/ui/components/interaction/OrganHoverContent.vue'
import RelicHoverContent from '@/ui/components/interaction/RelicHoverContent.vue'
import StoreOrganTile from '@/ui/page/Scene/running/BlackStoreRoom/components/StoreOrganTile.vue'
import Card from '@/ui/components/object/Card.vue'
import Popover from '@/ui/components/global/Popover.vue'
import { getRarityColor, getRarityLabel } from '@/static/list/system/rarityPalette'
import { ROOM_ACTION_Z_INDEX } from '@/ui/hooks/interaction/popoverHost'

const currentRoom = computed(() => {
    const room = nowGameRun.currentRoom
    if (room instanceof BlackStoreRoom) return room
    return null
})

const storeTitle = computed(() => currentRoom.value?.getDisplayName() || '黑市')

function rarityLabel(rarity: string) {
    return getRarityLabel(rarity)
}

function rarityColor(rarity: string) {
    return getRarityColor(rarity)
}

const allItems = computed(() => currentRoom.value?.getStoreItems() || [])
const organItems = computed(() => allItems.value.filter(i => i.type === 'organ'))
const relicItems = computed(() => allItems.value.filter(i => i.type === 'relic'))
const potionItems = computed(() => allItems.value.filter(i => i.type === 'potion'))
const cardItems = computed(() => allItems.value.filter(i => i.type === 'card'))

const allowSellOrgan = computed(() => currentRoom.value?.allowSellOrgan ?? false)
const allowSellMaterial = computed(() => currentRoom.value?.allowSellMaterial ?? false)
const allowSellHealth = computed(() => currentRoom.value?.allowSellHealth ?? false)
const canSellAnything = computed(() =>
    allowSellOrgan.value || allowSellMaterial.value || allowSellHealth.value
)

const organSellOffers = computed(() => currentRoom.value?.getOrganSellOffers() || [])

const playerCurrentHealth = computed(() => getCurrentValue(nowPlayer, 'health'))
const playerMaxHealth = computed(() => getStatusValue(nowPlayer, 'max-health'))
const playerMaterial = computed(() => getReserveModifier(nowPlayer).getReserve('material'))

const materialSellActualAmount = computed(() => currentRoom.value?.getMaterialSellActualAmount() || 0)
const materialSellPrice = computed(() => currentRoom.value?.getMaterialSellPricePreview() || 0)
const healthSellPrice = computed(() => currentRoom.value?.getHealthSellPricePreview() || 0)
const canSellHealthNow = computed(() => currentRoom.value?.canSellHealth() ?? false)

const page = ref<'buy' | 'sell'>('buy')
const selectedBuyItem = ref<StoreItem | null>(null)
const selectedSellOrgan = ref<Organ | null>(null)
const tooltipAnchor = ref<HTMLElement | null>(null)
const selectedSellOffer = computed(() =>
    organSellOffers.value.find(offer => offer.organ === selectedSellOrgan.value && !offer.sold) ?? null
)

const showDetail = computed(() => {
    const item = selectedBuyItem.value
    return !!item && (item.type === 'relic' || item.type === 'potion')
})

function getPreview(itemId: string): any {
    return currentRoom.value?.getPreviewInstance(itemId) ?? null
}

function getPotionDesc(itemId: string): string {
    const instance = getPreview(itemId)
    if (!instance) return ''
    const describe = instance.effect ?? instance.describe
    return describe ? getDescribe(describe, instance) : ''
}

function isBuySelected(item: StoreItem) {
    return selectedBuyItem.value?.id === item.id
}

function isSellSelected(organ: Organ) {
    return selectedSellOrgan.value === organ
}

function clearSelection() {
    selectedBuyItem.value = null
    selectedSellOrgan.value = null
    tooltipAnchor.value = null
}

function setPage(next: 'buy' | 'sell') {
    if (page.value === next) return
    page.value = next
    clearSelection()
}

function selectStoreItem(item: StoreItem, event: MouseEvent) {
    if (item.isPurchased) return
    if (isBuySelected(item)) {
        clearSelection()
        return
    }
    selectedSellOrgan.value = null
    selectedBuyItem.value = item
    tooltipAnchor.value = event.currentTarget as HTMLElement
}

function selectSellOrgan(organ: Organ, event: MouseEvent) {
    if (isSellSelected(organ)) {
        clearSelection()
        return
    }
    selectedBuyItem.value = null
    selectedSellOrgan.value = organ
    tooltipAnchor.value = event.currentTarget as HTMLElement
}

function canAfford(item: StoreItem) {
    return getReserveModifier(nowPlayer).getReserve('gold') >= item.price && !item.isPurchased
}

const cantAffordLines = [
    '滚。',
    '？',
    '别。碰。',
    '啊！？',
    '(厌恶的咋舌声)',
    '命，换，钱。',
]

async function confirmPurchase() {
    const item = selectedBuyItem.value
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

async function confirmSell() {
    const offer = selectedSellOffer.value
    if (!offer) return
    await handleSellOffer(offer)
}

async function handleSellOffer(offer: OrganSellOffer) {
    if (!currentRoom.value || offer.sold) return
    const confirmed = await showConfirm(
        '出售器官',
        `以 ${offer.sellPrice} 金币出售「${offer.organ.label}」？`
    )
    if (!confirmed) return
    await currentRoom.value.sellOrgan(offer.organ)
    if (selectedSellOrgan.value === offer.organ) clearSelection()
}

async function handleSellMaterial() {
    if (!currentRoom.value) return
    if (playerMaterial.value <= 0) {
        showDisplayMessage('"没有物质可卖。"', 2000)
        return
    }
    await currentRoom.value.sellMaterial()
}

async function handleSellHealth() {
    if (!currentRoom.value) return
    if (!canSellHealthNow.value) {
        showDisplayMessage('"生命值不足。"', 2000)
        return
    }
    await currentRoom.value.sellHealth()
}

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
    overflow-x: hidden;
    overflow-y: auto;
}

.blackstore-header {
    text-align: center;
    padding: 0.6rem 1.2rem 0.5rem;
    border-bottom: 2px solid black;
    display: flex;
    align-items: center;
    .title-container{
        flex-grow: 1;
    }
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

.page-tabs {
    position: absolute;
    left: 50%;
    transform: translate(80%);
    display: flex;
    justify-content: center;
    margin-top: 0.6rem;
    border: 2px solid black;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
}

.page-tab {
    padding: 0.3rem 1.4rem;
    font-size: 0.95rem;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.active {
        background: black;
        color: white;
    }
}

.store-panel,
.sell-panel {
    flex: none;
    padding: var(--layout-store-pad);
    display: flex;
    flex-direction: column;
    gap: var(--layout-store-gap);
    align-items: center;
    width: 100%;
    min-width: 0;
    max-width: 1200px;
    margin: 0 auto;
    box-sizing: border-box;
}

.store-panel > .store-category,
.sell-panel > .store-category {
    width: 100%;
    min-width: 0;
}

.store-category {
    display: flex;
    flex-direction: column;
    gap: var(--layout-gap-sm);
    min-width: 0;
}

.section-title {
    font-size: 1.2rem;
    margin: 0;
    padding-bottom: 0.3rem;
}

.items-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--layout-store-item-gap);
}

.organs-row {
    justify-content: center;
    flex-wrap: nowrap;
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.cards-row {
    flex-wrap: nowrap;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.goods-row {
    flex-wrap: nowrap;
    width: 100%;
    min-width: 0;
}

.goods-row .store-item {
    flex: 1 1 0;
    min-width: 0;
    max-width: none;
}

.store-card-slot {
    padding: 0.6rem;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: white;

    &:hover:not(.sold) {
        background: rgba(0, 0, 0, 0.05);
    }

    &.selected:not(.sold) {
        background-color: black;
        .item-price{
            color: white;
        }
    }

    &.sold {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.store-item {
    border: 2px solid black;
    padding: 0.8rem;
    cursor: pointer;
    position: relative;
    box-sizing: border-box;

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
    min-width: 0;
}

.item-name {
    font-weight: bold;
    font-size: 1rem;
    min-width: 0;
    overflow-wrap: anywhere;
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

.sell-resources {
    width: 100%;
    justify-content: center;
    display: flex;
    gap: var(--layout-store-gap);
}

.resource-block {
    flex: 1;
    min-width: 150px;
    max-width: 300px;
    // border: 2px solid black;
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.resource-title {
    font-weight: bold;
    font-size: 1rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.3rem;
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
    padding: 0.35rem;
    margin-top: 0.2rem;
    font-size: 0.85rem;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
}

.empty-hint {
    text-align: center;
    color: #999;
    padding: 1rem;
}

.store-actions {
    position: fixed;
    right: var(--layout-leave-right);
    bottom: var(--layout-leave-bottom);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--layout-gap-sm);
}

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

.store-second{
    display: flex;
    flex-wrap: nowrap;
    gap: var(--layout-store-gap);
    min-width: 0;
    width: 100%;
    justify-content: flex-start;

    > .store-category {
        flex: 0 1 auto;
        min-width: 0;
    }
}
.relics_and_potions{
    display: flex;
    flex-direction: column;
    gap: var(--layout-store-gap);
    flex: 1 1 0;
    min-width: 0;
}
</style>
