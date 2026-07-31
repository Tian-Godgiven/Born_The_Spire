import type { EffectFunc } from "@/core/objects/system/effect/EffectFunc"
import { handleEventEntity } from "@/core/objects/system/ActionEvent"
import { isEntity } from "@/core/utils/typeGuards"
import { showRewardIntercept } from "@/ui/hooks/interaction/rewardIntercept"
import { randomInt } from "@/core/hooks/random"

/**
 * 饥饿的怪物 - 战斗奖励拦截
 *
 * 挂在 owner (玩家) 的 after take beforeShowRewards 上：
 *   随机盯上一份战利品，弹窗让玩家选「让给它」/「抢过来」
 *   未喂计数 ≥ 3 时强制占据（单钮，只能让）
 *   让 → 好感度 +1、未喂计数清零、rewards.splice 掉这份
 *   抢 → 未喂计数 +1、reward 保留
 *
 * 回调是 async，Trigger.ts 会 await，可安全等待模态框返回
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
            callback: async (triggerEvent: any) => {
                const info: any = triggerEvent.info
                const rewards = info?.rewards
                if (!Array.isArray(rewards) || rewards.length === 0) return

                const refuseStatus = relic.status["hungry-beast-refuse-count"]
                const favorStatus = relic.status["hungry-beast-favor"]
                const refuseCount = refuseStatus?.value ?? 0
                const forced = refuseCount >= 3

                const idx = randomInt(0, rewards.length - 1, "hungryBeast")
                const picked = rewards[idx]

                const choice = await showRewardIntercept({
                    title: "饥饿的怪物",
                    description: forced
                        ? "你已连续三次抢在它前面。它冷冷望了你一眼，径直叼走了这份战利品——"
                        : "它的目光死死盯着这份战利品……",
                    reward: picked,
                    yieldLabel: "让给它（好感度 +1）",
                    grabLabel: "抢过来（未喂 +1）",
                    forced,
                    forcedLabel: "（已被强制占据）我知道了"
                })

                if (choice === "yield") {
                    rewards.splice(idx, 1)
                    if (favorStatus) favorStatus.setOriginalBaseValue((favorStatus.value ?? 0) + 1)
                    if (refuseStatus) refuseStatus.setOriginalBaseValue(0)
                } else {
                    if (refuseStatus) refuseStatus.setOriginalBaseValue((refuseStatus.value ?? 0) + 1)
                }
            }
        })
        event.collectSideEffect(remove)
    })
}
