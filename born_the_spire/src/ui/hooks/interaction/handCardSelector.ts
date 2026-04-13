/**
 * 手牌选择器状态管理
 *
 * 用于战斗中从手牌选择卡牌的交互（如丢弃、消耗等）
 * 通过 card._chooseAble 属性标记哪些卡牌可选
 */

import { ref, computed, type ComputedRef } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'
import { nowPlayer } from '@/core/objects/game/run'

export interface HandCardSelectorConfig {
    title: string              // 说明文本，如 "选择1张卡牌来丢弃"
    minSelect: number          // 最少选择数量
    maxSelect: number          // 最多选择数量
    cancelable: boolean        // 是否可取消
    event?: any                // 传入事件对象，默认自动排除 event.medium（正在使用的卡牌）
    includeMedium?: boolean    // 设为 true 时不排除 event.medium（默认 false）
    excludeIds?: string[]      // 额外要排除的卡牌 ID 列表
    filter?: (card: Card) => boolean  // 自定义过滤器（与上述叠加）
}

// ==================== 全局状态 ====================

const _active = ref(false)
const _config = ref<HandCardSelectorConfig>({
    title: '',
    minSelect: 1,
    maxSelect: 1,
    cancelable: false
})
const _selectedCards = ref<Card[]>([])
const _maskHidden = ref(false)

let _resolve: ((cards: Card[]) => void) | null = null

// ==================== 导出的响应式状态 ====================

export const handCardSelectorActive = computed(() => _active.value)
export const handCardSelectorConfig = computed(() => _config.value)
export const handCardSelectorSelectedCards = computed(() => _selectedCards.value) as any as ComputedRef<Card[]>
export const handCardSelectorMaskHidden = computed(() => _maskHidden.value)

export const canConfirm = computed(() => {
    return _selectedCards.value.length >= _config.value.minSelect
        && _selectedCards.value.length <= _config.value.maxSelect
})

// ==================== 操作函数 ====================

/**
 * 给手牌设置 _chooseAble 属性
 */
function markChooseAble(config: HandCardSelectorConfig) {
    const handPile = nowPlayer.cardPiles.handPile

    // 合并所有排除 ID：event.medium + excludeIds
    const ids: string[] = [...(config.excludeIds || [])]
    if (!config.includeMedium) {
        const mediumId = config.event?.medium?.__id
        if (mediumId) ids.push(mediumId)
    }
    const excludeSet = ids.length > 0 ? new Set(ids) : null

    for (const card of handPile) {
        let chooseable = true
        if (excludeSet && excludeSet.has(card.__id)) chooseable = false
        if (chooseable && config.filter && !config.filter(card)) chooseable = false
        ;(card as any)._chooseAble = chooseable
    }
}

/**
 * 清除所有手牌的 _chooseAble 属性
 */
function clearChooseAble() {
    const handPile = nowPlayer.cardPiles.handPile
    for (const card of handPile) {
        delete (card as any)._chooseAble
    }
    // 也清除已选中卡牌的属性（它们可能已不在手牌中）
    for (const card of _selectedCards.value) {
        delete (card as any)._chooseAble
    }
}

/**
 * 切换卡牌选中状态
 */
export function toggleCardSelection(card: Card & { _chooseAble?: boolean }) {
    if (!_active.value) return

    // 已选中 → 取消选择
    const index = _selectedCards.value.findIndex(c => c.__id === card.__id)
    if (index >= 0) {
        _selectedCards.value.splice(index, 1)
        ;(card as any)._chooseAble = true
        return
    }

    // 未选中 → 需要可选
    if (!(card as any)._chooseAble) return

    // 已满选 → 顶掉最早选择的卡牌
    if (_selectedCards.value.length >= _config.value.maxSelect) {
        const oldest = _selectedCards.value.shift()!
        ;(oldest as any)._chooseAble = true
    }

    _selectedCards.value.push(card as any)
    ;(card as any)._chooseAble = false
}

/**
 * 检查卡牌是否被选中
 */
export function isCardSelected(card: Card): boolean {
    return _selectedCards.value.some(c => c.__id === card.__id)
}

/**
 * 确认选择
 */
export function confirmSelection() {
    if (!canConfirm.value) return
    const result = [..._selectedCards.value] as any
    cleanup()
    _resolve?.(result)
    _resolve = null
}

/**
 * 取消选择
 */
export function cancelSelection() {
    if (!_config.value.cancelable) return
    cleanup()
    _resolve?.([])
    _resolve = null
}

/**
 * 切换遮罩显示/隐藏
 */
export function toggleMask() {
    _maskHidden.value = !_maskHidden.value
}

function cleanup() {
    clearChooseAble()
    _active.value = false
    _selectedCards.value = []
    _maskHidden.value = false
}

// ==================== 主入口 ====================

/**
 * 从手牌中选择卡牌
 *
 * @returns 选中的卡牌数组（取消时返回空数组）
 */
export function selectFromHand(config: HandCardSelectorConfig): Promise<Card[]> {
    return new Promise((resolve) => {
        _config.value = config
        _selectedCards.value = []
        _maskHidden.value = false
        _resolve = resolve
        _active.value = true
        markChooseAble(config)
    })
}
