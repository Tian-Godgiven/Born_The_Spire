import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'

export const cardCommands: ConsoleCommand[] = [
    {
        name: 'listCards',
        group: '卡牌',
        description: '列出所有可用卡牌',
        usage: 'listCards()',
        examples: ['listCards("悔恨")'],
        execute: async (args, addOutput) => {
            try {
                const { cardList } = await import('@/static/list/item/cardList')
                const keyword = args[0]
                let cards = cardList
                if (keyword) {
                    cards = cards.filter((c: any) => c.label?.includes(keyword) || c.key?.includes(keyword))
                }
                if (cards.length === 0) {
                    addOutput(keyword ? `没有找到匹配 "${keyword}" 的卡牌` : '没有可用的卡牌', 'info')
                    return
                }
                addOutput(`共 ${cards.length} 张卡牌:`, 'info')
                for (const card of cards) {
                    addOutput(`  ${card.label} - ${card.key}`, 'result', `addCard("${card.key}")`)
                }
            } catch (error: any) {
                addOutput(`列出卡牌失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addCard',
        group: '卡牌',
        description: '添加卡牌到卡组',
        usage: 'addCard("key")',
        examples: ['addCard("sts_card_regret")'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始', 'error')
                return
            }
            const cardKey = args[0]
            if (!cardKey) {
                addOutput('用法: addCard("cardKey")', 'error')
                addOutput('使用 listCards() 查看所有可用卡牌', 'info')
                return
            }
            try {
                const { getCardModifier } = await import('@/core/objects/system/modifier/CardModifier')
                const cardModifier = getCardModifier(nowPlayer)
                const cards = await cardModifier.addCardsFromSource(nowPlayer, [cardKey])
                if (cards.length > 0) {
                    addOutput(`✓ 已添加 ${cards[0].label} 到卡组`, 'result')
                } else {
                    addOutput(`添加失败：未找到卡牌 ${cardKey}`, 'error')
                }
            } catch (error: any) {
                addOutput(`添加卡牌失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'drawCard',
        group: '卡牌',
        description: '从抽牌堆抽牌（默认1张）',
        usage: 'drawCard(n?)',
        examples: ['drawCard()', 'drawCard(3)'],
        execute: async (args, addOutput) => {
            if (!nowPlayer) {
                addOutput('游戏未开始', 'error')
                return
            }
            const { nowBattle } = await import('@/core/objects/game/battle')
            if (!nowBattle.value) {
                addOutput('当前不在战斗中', 'error')
                return
            }
            const n = args[0] ?? 1
            try {
                nowPlayer.drawCard(n, nowPlayer)
                addOutput(`✓ 抽取了 ${n} 张牌`, 'result')
            } catch (error: any) {
                addOutput(`抽牌失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addCardToHand',
        group: '卡牌',
        description: '直接添加卡牌到手牌',
        usage: 'addCardToHand("key")',
        examples: ['addCardToHand("sts_card_regret")'],
        execute: async (args, addOutput) => {
            if (!nowPlayer) {
                addOutput('游戏未开始', 'error')
                return
            }
            const cardKey = args[0]
            if (!cardKey) {
                addOutput('用法: addCardToHand("cardKey")', 'error')
                addOutput('使用 listCards() 查看所有可用卡牌', 'info')
                return
            }
            try {
                const { getCardByKey } = await import('@/static/list/item/cardList')
                const { enterHand } = await import('@/core/effects/card')
                const card = await getCardByKey(cardKey)
                if (!card) {
                    addOutput(`未找到卡牌: ${cardKey}`, 'error')
                    return
                }
                enterHand(card, nowPlayer.cardPiles.handPile, nowPlayer)
                addOutput(`✓ 已添加 ${card.label} 到手牌`, 'result')
            } catch (error: any) {
                addOutput(`添加卡牌到手牌失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addTempCard',
        group: '临时物品',
        description: '添加临时卡牌',
        usage: 'addTempCard("key", "removeOn")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const cardKey = args[0]
            const removeOn = args[1] || 'battleEnd'
            if (!cardKey) {
                addOutput('用法: addTempCard("cardKey", "removeOn")', 'error')
                addOutput('例如: addTempCard("original_card_00001", "battleEnd")', 'info')
                addOutput('移除时机: battleEnd, turnEnd, floorEnd', 'info')
                return
            }
            try {
                const { addTemporaryCard } = await import('@/core/hooks/temporary')
                const card = await addTemporaryCard(cardKey, nowPlayer, removeOn as any)
                addOutput(`✓ 成功添加临时卡牌: ${card.label} (${removeOn})`, 'result')
            } catch (error: any) {
                addOutput(`添加临时卡牌失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'addTempOrgan',
        group: '临时物品',
        description: '添加临时器官',
        usage: 'addTempOrgan("key", "removeOn")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const organKey = args[0]
            const removeOn = args[1] || 'battleEnd'
            if (!organKey) {
                addOutput('用法: addTempOrgan("organKey", "removeOn")', 'error')
                addOutput('例如: addTempOrgan("original_organ_00001", "battleEnd")', 'info')
                addOutput('移除时机: battleEnd, turnEnd, floorEnd', 'info')
                return
            }
            try {
                const { addTemporaryOrgan } = await import('@/core/hooks/temporary')
                const organ = await addTemporaryOrgan(organKey, nowPlayer, removeOn as any)
                addOutput(`✓ 成功添加临时器官: ${organ.label} (${removeOn})`, 'result')
            } catch (error: any) {
                addOutput(`添加临时器官失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'listTempItems',
        group: '临时物品',
        description: '列出临时物品',
        usage: 'listTempItems()',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            try {
                const { getAllTemporaryItems } = await import('@/core/hooks/temporary')
                const items = getAllTemporaryItems()
                if (!items || items.length === 0) {
                    addOutput('当前没有临时物品', 'info')
                    return
                }
                addOutput(`=== 当前 ${items.length} 个临时物品 ===`, 'info')
                for (const item of items) {
                    const removeOn = (item as any).removeOn || '未知'
                    addOutput(`  ${item.label} (移除时机: ${removeOn})`, 'result')
                }
            } catch (error: any) {
                addOutput(`列出临时物品失败: ${error.message}`, 'error')
            }
        }
    },
]
