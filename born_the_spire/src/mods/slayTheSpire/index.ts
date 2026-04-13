/**
 * SlayTheSpire Mod 主入口
 */

import type { Mod } from '../ModLoader'
import { slayTheSpireModConfig } from './mod'
import { registerCard } from '../index'
import { slayTheSpireCards } from './cards'

export const slayTheSpireMod: Mod = {
    config: slayTheSpireModConfig,

    load: async () => {
        console.log(`[Mod:SlayTheSpire] 开始加载...`)

        // 注册卡牌
        for (const card of slayTheSpireCards) {
            registerCard(card)
        }

        console.log(`[Mod:SlayTheSpire] 加载完成 (${slayTheSpireCards.length} 张卡牌)`)
    }
}
