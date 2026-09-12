import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { markBeastLoot } from "@/ui/hooks/interaction/rewardDisplay"
import { getGlobalRandom } from "@/core/hooks/random"

/**
 * 小兽伙伴 - 战斗奖励标记
 *
 * 挂在 owner (玩家) 的 after take beforeShowRewards 上：
 *   随机盯上一份战利品，战利品页用 🐕 标出
 *   未喂计数 ≥ 3 时强制占据（那一行不能领）
 *   玩家领走 → 未喂 +1；最终没领 → 好感度 +1、未喂清零（见 rewardDisplay）
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
