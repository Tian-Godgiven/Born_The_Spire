import type { Relic } from "@/core/objects/item/Subclass/Relic"
import { showPopUp } from "../hooks/global/popUp"
import { shallowRef } from "vue"
import RelicDetail from "@/ui/page/popUp/RelicDetail.vue"
import { nowPlayer } from "@/core/objects/game/run"

/**
 * 显示遗物详情弹窗，支持左右切换
 * @param initialRelic 初始显示的遗物，不传则显示第一个
 */
export function showRelicList(initialRelic?: Relic) {
    if (!nowPlayer) {
        console.error("当前没有玩家")
        return false
    }

    const relics = nowPlayer.getRelicsList()
    if (relics.length === 0) return false

    const initialIndex = initialRelic ? relics.indexOf(initialRelic) : 0

    showPopUp({
        mask: true,
        vue: shallowRef(RelicDetail),
        props: {
            relics,
            initialIndex: initialIndex >= 0 ? initialIndex : 0
        }
    })
}
