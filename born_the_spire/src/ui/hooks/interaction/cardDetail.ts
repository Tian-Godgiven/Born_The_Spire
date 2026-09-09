import { shallowRef } from "vue"
import type { Card } from "@/core/objects/item/Subclass/Card"
import { showPopUp } from "@/ui/hooks/global/popUp"
import CardDetail from "@/ui/page/popUp/CardDetail.vue"

/**
 * 打开卡牌详情弹窗。外部只调这个。
 *
 * 传入运行时卡牌实例（卡组里的、器官描述解析出来的）。
 * 勾选锻造预览时会另建临时牌，不改手里那张。
 */
export function showCardDetail(card: Card) {
    showPopUp({
        mask: true,
        vue: shallowRef(CardDetail),
        props: { card }
    })
}
