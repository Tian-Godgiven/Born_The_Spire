import { ref } from 'vue'
import type { Card } from '@/core/objects/item/Subclass/Card'

/**
 * 卡牌组弹窗状态
 */
export const showCardGroupModal = ref(false)
export const cardGroupTitle = ref('')
export const cardGroupList = ref<Card[]>([])

let cardGroupResolver: (() => void) | null = null

/**
 * 显示卡牌组弹窗
 * @param title 弹窗标题
 * @param cards 要显示的卡牌列表
 * @returns Promise，弹窗关闭时resolve
 */
export function showCardGroup(title: string, cards: Card[]): Promise<void> {
    cardGroupTitle.value = title
    cardGroupList.value = cards
    showCardGroupModal.value = true

    return new Promise<void>((resolve) => {
        cardGroupResolver = resolve
    })
}

/**
 * 关闭卡牌组弹窗
 */
export function closeCardGroupModal() {
    showCardGroupModal.value = false
    if (cardGroupResolver) {
        cardGroupResolver()
        cardGroupResolver = null
    }
}
