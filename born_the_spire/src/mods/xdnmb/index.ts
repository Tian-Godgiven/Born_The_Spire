/**
 * xdnmb Mod 主入口
 */

import type { Mod } from '../ModLoader'
import { xdnmbModConfig } from './mod'
import { registerRelic, registerOrgan, registerEnemy, registerCard } from '../index'

// 导入遗物
import { wheelOfFateRelic } from './relics/bloodPrism'
// 器官血量系统未做，血偿棱镜暂时不注册
// import { bloodPrismRelic } from './relics/bloodPrism'
// import { bloodPrismChainDamageEffect } from './effects/relicEffects'

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

        // 器官血量系统未做，血偿棱镜暂时不注册
        // registerEffect(bloodPrismChainDamageEffect)
        // registerRelic(bloodPrismRelic)

        // 注册遗物
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
