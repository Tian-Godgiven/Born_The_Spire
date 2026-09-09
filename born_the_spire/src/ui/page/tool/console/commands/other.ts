import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { settings } from '@/core/persistence/settings'

export const otherCommands: ConsoleCommand[] = [
    {
        name: 'toggleTestMode',
        group: '其他',
        description: '切换测试模式（开：开局秒杀/永生/无敌；关：3打击+3防御）',
        usage: 'toggleTestMode()',
        examples: ['toggleTestMode()', 'toggleTestMode(true)', 'toggleTestMode(false)'],
        execute: (args, addOutput) => {
            const arg = args[0]
            if (arg === true || arg === false) {
                settings.testMode = arg
            } else {
                settings.testMode = !settings.testMode
            }
            addOutput(
                settings.testMode
                    ? '✓ 测试模式已开启。下次开始游戏（重新进入选器官）会带上秒杀/永生/无敌。'
                    : '✓ 测试模式已关闭。下次开始游戏开局为 3 打击 + 3 防御。',
                'result'
            )
        }
    },
]
