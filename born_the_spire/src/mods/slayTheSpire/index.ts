/**
 * SlayTheSpire Mod 主入口
 */

import type { Mod } from '../ModLoader'
import { slayTheSpireModConfig } from './mod'
import { registerCard, registerEvent, registerRelic } from '../index'
import { addCardToBlackStorePool } from '@/static/list/room/blackStore/blackStoreItemPool'
import { slayTheSpireCards } from './cards'
import { panaceaCard } from './cards/skill'
import { slayTheSpireEvents } from './events'
import { slayTheSpireRelics } from './relics'

export const slayTheSpireMod: Mod = {
    config: slayTheSpireModConfig,

    load: async () => {
        console.log(`[Mod:SlayTheSpire] 开始加载...`)

        // 注册卡牌
        for (const card of slayTheSpireCards) {
            registerCard(card)
        }

        // 注册遗物
        for (const relic of slayTheSpireRelics) {
            registerRelic(relic)
        }

        // 注册事件
        for (const event of slayTheSpireEvents) {
            registerEvent(event)
        }

        // 添加卡牌到黑市卡牌池
        addCardToBlackStorePool(panaceaCard)

        console.log(`[Mod:SlayTheSpire] 加载完成 (${slayTheSpireCards.length} 张卡牌, ${slayTheSpireRelics.length} 个遗物, ${slayTheSpireEvents.length} 个事件)`)
    }
}
