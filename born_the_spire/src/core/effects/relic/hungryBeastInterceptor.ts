import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { markBeastLoot } from "@/ui/hooks/interaction/beastLoot"
import { getGlobalRandom } from "@/core/hooks/random"
import "@/ui/hooks/interaction/registerBeastLootAddon"

/**
 * 小兽伙伴：战斗奖励标记
 *
 * 挂在 owner 的 after take beforeShowRewards 上，随机盯上一份。
 * UI 由战利品行插件 BeastLootAddon 负责，不写进 RewardModal。
 */
export const hungryBeast_registerInterceptor: EffectFunc = (event, effect) => {
    const { target, medium } = event
    const relic = medium as any
    if (!relic || !relic.status) return

    handleEventEntity(target, (owner) => {
        if (!isEntity(owner)) return

        const { remove } = owner.appendTrigger({
            when: "after",
            how: "take",
            key: "beforeShowRewards",
            callback: (triggerEvent: any) => {
                if (relic.isDisabled || Number(relic.status?.disabled?.value ?? 0) > 0) return

                const info: any = triggerEvent.info
                const rewards = info?.rewards
                if (!Array.isArray(rewards) || rewards.length === 0) return

                const refuseStatus = relic.status["hungry-beast-refuse-count"]
                const refuseCount = refuseStatus?.value ?? 0
                const forced = refuseCount >= 3

                const idx = getGlobalRandom().nextInt(0, rewards.length - 1)
                markBeastLoot(rewards[idx], relic, forced)
            }
        })
        event.collectSideEffect(remove)
    })
}
