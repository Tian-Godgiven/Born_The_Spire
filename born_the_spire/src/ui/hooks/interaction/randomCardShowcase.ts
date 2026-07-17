import type { Card } from "@/core/objects/item/Subclass/Card"
import { showComponent } from "@/core/hooks/componentManager"
import RandomCardShowcase from "@/ui/components/interaction/RandomCardShowcase.vue"

/**
 * 展示一张卡牌的"献祭 / 复制"演出：
 *   1. 卡牌淡入出现
 *   2. 停留 holdMs 让玩家看清
 *   3. 按 mode 播放退出动画（remove: 上升消散；duplicate: 光辉扩散）
 * Promise 在演出播完时 resolve。
 */
export async function showRandomCardShowcase(
    card: Card,
    mode: "remove" | "duplicate",
    holdMs: number = 1000
): Promise<void> {
    await showComponent({
        component: RandomCardShowcase,
        data: { card, mode, holdMs },
        layout: "modal"
    })
}
