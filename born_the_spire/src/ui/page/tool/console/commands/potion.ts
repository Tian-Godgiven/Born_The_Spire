import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowPlayer } from '@/core/objects/game/run'

export const potionCommands: ConsoleCommand[] = [
    {
        name: 'listPotions',
        group: '药水',
        description: '列出所有可用药水',
        usage: 'listPotions()',
        execute: async (args, addOutput) => {
            try {
                const { potionList } = await import('@/static/list/item/potionList')
                if (potionList.length === 0) {
                    addOutput('没有可用的药水', 'info')
                    return
                }
                addOutput(`共 ${potionList.length} 种药水:`, 'info')
                for (const potion of potionList) {
                    addOutput(`  ${potion.label} - ${potion.key}`, 'result', `gainPotion("${potion.key}")`)
                }
            } catch (error: any) {
                addOutput(`列出药水失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'gainPotion',
        group: '药水',
        description: '获得药水',
        usage: 'gainPotion("key")',
        examples: ['gainPotion("original_potion_00001")'],
        execute: async (args, addOutput) => {
            if (!nowPlayer) {
                addOutput('游戏未开始', 'error')
                return
            }
            const potionKey = args[0]
            if (!potionKey) {
                addOutput('用法: gainPotion("potionKey")', 'error')
                addOutput('使用 listPotions() 查看所有可用药水', 'info')
                return
            }
            try {
                const result = await nowPlayer.getPotion(potionKey)
                if (result) {
                    addOutput(`✓ 获得药水: ${potionKey}`, 'result')
                } else {
                    addOutput('药水栏已满', 'error')
                }
            } catch (error: any) {
                addOutput(`获得药水失败: ${error.message}`, 'error')
            }
        }
    },
]
