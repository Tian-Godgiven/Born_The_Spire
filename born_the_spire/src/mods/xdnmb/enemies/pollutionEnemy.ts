/**
 * xdnmb Mod - 敌人数据
 */

import type { EnemyMap } from '@/core/objects/target/Enemy'

export const pollutionEnemy: EnemyMap = {
    label: '污染者',
    key: 'xdnmb_enemy_000001',
    status: {
        'max-health': 20,
        'action-order': 5
    },
    organ: [
        'xdnmb_organ_000001',  // 污染源
        'xdnmb_organ_000002'   // 余热炉
    ],
    cards: [
        'enemy_stone_strike'  // 石击（原版通用卡牌）
    ],
    behavior: {
        patterns: [
            {
                priority: 5,
                condition: {
                    turn: { equals: 1 }
                },
                action: {
                    selector: {},
                    mode: 'sequence',
                    sequence: [
                        'enemy_stone_strike',   // 第一张：攻击
                        'original_card_00014'   // 第二张：防御
                    ]
                },
                describe: '第1回合：攻击+防御'
            },
            {
                priority: 3,
                condition: {
                    turn: { mod: [2, 0] }
                },
                action: {
                    selector: { tags: ['defence'] },
                    mode: 'random'
                },
                describe: '偶数回合：防御'
            }
        ],
        fallback: {
            action: {
                selector: { tags: ['attack'] },
                mode: 'random'
            },
            describe: '默认：攻击'
        }
    }
}
