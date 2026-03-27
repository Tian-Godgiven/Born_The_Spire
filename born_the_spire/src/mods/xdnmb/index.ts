/**
 * xdnmb Mod 主入口
 */

import type { Mod } from '../ModLoader'
import { xdnmbModConfig } from './mod'
import { registerRelic, registerEffect, registerOrgan, registerEnemy } from '../index'

// 导入遗物
import { bloodPrismRelic } from './relics/bloodPrism'

// 导入效果
import { bloodPrismChainDamageEffect } from './effects/relicEffects'

// 导入器官
import { pollutionSourceOrgan, wasteHeatOrgan } from './organs/organs'

// 导入敌人
import { pollutionEnemy } from './enemies/pollutionEnemy'

export const xdnmbMod: Mod = {
    config: xdnmbModConfig,

    load: async () => {
        console.log(`[Mod:xdnmb] 开始加载...`)

        // 注册效果
        registerEffect(bloodPrismChainDamageEffect)

        // 注册遗物
        registerRelic(bloodPrismRelic)

        // 注册器官
        registerOrgan(pollutionSourceOrgan)
        registerOrgan(wasteHeatOrgan)

        // 注册敌人
        registerEnemy(pollutionEnemy)

        console.log(`[Mod:xdnmb] 加载完成`)
    }
}
