import type { CompanionMap } from "@/core/objects/target/Companion"
import { createCompanion } from "@/core/factories"

export const companionList: CompanionMap[] = [
    {
        label: "小石怪",
        key: "companion_stone_golem",
        status: { "max-health": 30 },
        organ: ["original_organ_00003"],
        cards: ["enemy_stone_strike"],
        behavior: {
            patterns: [],
            fallback: {
                action: {
                    selector: { tags: ["attack"] },
                    mode: "random"
                },
                describe: "石击"
            }
        },
        targetWeight: 1,
        autoAct: true,
        showIntent: true,
        uiSize: "small"
    },
    {
        label: "你（小）",
        key: "companion_fission_offspring",
        status: { "max-health": 5 },
        organ: [],
        cards: ["companion_card_weak_strike"],
        behavior: {
            patterns: [],
            fallback: {
                action: {
                    selector: { key: "companion_card_weak_strike" },
                    mode: "random"
                },
                describe: "打击（弱）"
            }
        },
        targetWeight: 1,
        autoAct: true,
        showIntent: true,
        uiSize: "small"
    }
]

export async function getCompanionByKey(key: string) {
    const data = companionList.find(value => value.key === key)
    if (!data) throw new Error(`没有指定的召唤物: ${key}`)
    return createCompanion(data)
}
