/**
 * xdnmb Mod - 血偿棱镜遗物
 */

import type { RelicMap } from '@/core/objects/item/Subclass/Relic'

export const bloodPrismRelic: RelicMap = {
    label: '血偿棱镜',
    describe: ['主动使用：选择一个友方非器官单位，对其造成', '6~12', '点随机伤害，然后对所有敌人造成该伤害的', '2', '倍'],
    key: 'xdnmb_relic_000001',
    rarity: 'rare',
    activeAbilities: [{
        key: 'prismaticSacrifice',
        label: '棱镜献祭',
        describe: ['选择一个友方非器官单位，对其造成6~12点随机伤害，然后对所有敌人造成该伤害的2倍'],
        usage: {
            type: 'selectTarget',
            target: { faction: 'player', key: 'nonOrgan' }
        },
        restrictions: {
            conditions: {
                scene: 'combat'
            }
        },
        effects: [{
            key: 'bloodPrismChainDamage',
            params: { min: 6, max: 12, multiplier: 2 }
        }]
    }],
    interaction: {}
}
