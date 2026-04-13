/**
 * xdnmb Mod 主入口
 */

import type { Mod } from '../ModLoader'
import { xdnmbModConfig } from './mod'
import { registerRelic, registerEffect, registerOrgan, registerEnemy, registerCard } from '../index'

// 导入遗物
import { bloodPrismRelic, wheelOfFateRelic } from './relics/bloodPrism'

// 导入效果
import { bloodPrismChainDamageEffect } from './effects/relicEffects'

// 导入卡牌
import { venomspinePierceCard } from './cards/organCards'

// 导入器官
import { pollutionSourceOrgan, wasteHeatOrgan, venomspineOrgan } from './organs/organs'

// 导入敌人
import { pollutionEnemy } from './enemies/pollutionEnemy'

export const xdnmbMod: Mod = {
    config: xdnmbModConfig,

    load: async () => {
        console.log(`[Mod:xdnmb] 开始加载...`)

        // 注册卡牌
        registerCard(venomspinePierceCard)

        // 注册效果
        registerEffect(bloodPrismChainDamageEffect)

        // 注册遗物
        registerRelic(bloodPrismRelic)
        registerRelic(wheelOfFateRelic)

        // 注册器官
        registerOrgan(pollutionSourceOrgan)
        registerOrgan(wasteHeatOrgan)
        registerOrgan(venomspineOrgan)

        // 注册敌人
        registerEnemy(pollutionEnemy)

        console.log(`[Mod:xdnmb] 加载完成`)
    }
}
