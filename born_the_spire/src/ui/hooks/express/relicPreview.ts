import { nowPlayer } from "@/core/objects/game/run"
import { getRelicModifier } from "@/core/objects/system/modifier/RelicModifier"
import { getLazyModule } from "@/core/utils/lazyLoader"
import type { Relic } from "@/core/objects/item/Subclass/Relic"
import { markRaw } from "vue"

export function findOwnedRelic(relicKey: string): Relic | null {
    try {
        if (!nowPlayer) return null
        return getRelicModifier(nowPlayer).getRelicByKey(relicKey) ?? null
    } catch {
        return null
    }
}

/** 已持有用身上那件；未持有按 key 造仅供预览的实例。 */
export async function resolveRelicForPreview(relicKey: string): Promise<Relic | null> {
    const owned = findOwnedRelic(relicKey)
    if (owned) return markRaw(owned)
    try {
        const list = getLazyModule<any[]>("relicList")
        const map = list.find(item => item.key === relicKey)
        if (!map) return null
        const { createRelic } = await import("@/core/factories")
        return markRaw(await createRelic(map) as Relic)
    } catch (error) {
        console.error("[relicPreview] 无法加载遗物", relicKey, error)
        return null
    }
}
