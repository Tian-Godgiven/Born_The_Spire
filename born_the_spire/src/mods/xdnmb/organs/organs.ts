/**
 * xdnmb Mod - 器官数据
 */

import type { OrganMap } from '@/core/objects/target/Organ'
import { OrganRarity, OrganPartEnum } from '@/core/types/OrganTypes'

export const pollutionSourceOrgan: OrganMap = {
    label: '污染源',
    key: 'xdnmb_organ_000001',
    describe: [{ key: ['status', 'card-count'] }, '/', { key: ['status', 'max-card-count'] }, ' 玩家每打出5张牌，向其手牌添加2张伤口'],
    rarity: OrganRarity.Rare,
    part: OrganPartEnum.Core,
    status: {
        'max-mass': 20,
        'card-count': 0,
        'max-card-count': 5
    },
    current: ['mass', 'card-count'],
    reaction: {
        countAndAddWound: [{
            key: 'count-and-add-wound',
            targetType: 'triggerSource',
            mediumTargetType: 'triggerEventMedium',
            effect: [{
                key: 'countAndTrigger',
                params: {
                    countKey: 'card-count',
                    threshold: 5,
                    onTrigger: {
                        key: 'add-wound',
                        targetType: 'triggerOwner',
                        effect: [{
                            key: 'addCardToHand',
                            params: { cardKey: 'original_card_00100', count: 2 }
                        }]
                    }
                }
            }]
        }]
    },
    interaction: {
        possess: {
            target: { key: 'self' },
            triggers: [{
                when: 'after',
                how: 'make',
                key: 'useCard',
                timing: 'battleStart',
                triggerTarget: { participantType: 'entity', key: 'player' },
                action: 'countAndAddWound'
            }]
        }
    }
}

export const wasteHeatOrgan: OrganMap = {
    label: '余热炉',
    key: 'xdnmb_organ_000002',
    describe: ['提供1张', { '@': 0 }, '卡牌到牌组', '获得时增加2点最大生命并治疗'],
    rarity: OrganRarity.Uncommon,
    part: OrganPartEnum.Gland,
    status: {
        'max-mass': 25
    },
    current: ['mass'],
    cardsByOwner: {
        player: ['player_waste_heat_recovery'],
        enemy: ['enemy_waste_heat_recovery']
    },
    interaction: {
        possess: {
            target: { key: 'self' },
            effects: [{
                key: 'addMaxHealthAndHeal',
                params: { value: 2 }
            }]
        }
    }
}
