import type { ConsoleCommand } from '@/core/utils/consoleCommandRegistry'
import { nowGameRun, nowPlayer } from '@/core/objects/game/run'

export const stateCommands: ConsoleCommand[] = [
    {
        name: 'listStates',
        group: '状态',
        description: '列出玩家当前状态',
        usage: 'listStates()',
        execute: async (_args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const { getStateModifier } = await import('@/core/objects/system/modifier/StateModifier')
            const states = getStateModifier(nowPlayer).getAllStates()
            if (states.length === 0) {
                addOutput('玩家当前没有状态', 'info')
                return
            }
            addOutput(`=== 当前 ${states.length} 个状态 ===`, 'info')
            for (const state of states) {
                const stacks = state.stacks.map(stack => `${stack.key}:${stack.stack}`).join(', ')
                addOutput(`  ${state.label} (${state.key}) [${stacks}]`, 'result', undefined, undefined, [
                    { label: '移除', command: `removeState("${state.key}")` }
                ])
            }
        }
    },
    {
        name: 'listAllStates',
        group: '状态',
        description: '列出所有可用状态',
        usage: 'listAllStates()',
        execute: async (_args, addOutput) => {
            const { stateList } = await import('@/static/list/target/stateList')
            addOutput(`=== 共有 ${stateList.length} 个可用状态 ===`, 'info')
            for (const state of stateList) {
                addOutput(`  [${state.category || 'neutral'}] ${state.label} - ${state.key}`, 'result', undefined, undefined, [
                    { label: '添加', command: `addState("${state.key}", 1)` }
                ])
            }
        }
    },
    {
        name: 'addState',
        group: '状态',
        description: '给玩家添加指定状态',
        usage: 'addState("key", stacks?)',
        examples: ['addState("poison", 3)', 'addState("power", 2)'],
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const [stateKey, stacks = 1] = args
            if (!stateKey || typeof stacks !== 'number') {
                addOutput('用法: addState("stateKey", stacks?)', 'error')
                addOutput('使用 listAllStates() 查看所有可用状态', 'info')
                return
            }
            try {
                const { stateList } = await import('@/static/list/target/stateList')
                const { getStateModifier } = await import('@/core/objects/system/modifier/StateModifier')
                const stateData = stateList.find(state => state.key === stateKey)
                if (!stateData) {
                    addOutput(`未找到状态: ${stateKey}`, 'error')
                    return
                }
                getStateModifier(nowPlayer).addState(stateData, stacks, nowPlayer)
                addOutput(`✓ 已给玩家添加 ${stateData.label} (${stateKey}) ×${stacks}`, 'result')
            } catch (error: any) {
                addOutput(`添加状态失败: ${error.message}`, 'error')
            }
        }
    },
    {
        name: 'removeState',
        group: '状态',
        description: '移除玩家指定状态',
        usage: 'removeState("key")',
        execute: async (args, addOutput) => {
            if (!nowGameRun) {
                addOutput('游戏未开始，请先点击"开始游戏"', 'error')
                return
            }
            const stateKey = args[0]
            if (!stateKey) {
                addOutput('用法: removeState("stateKey")', 'error')
                return
            }
            const { getStateModifier } = await import('@/core/objects/system/modifier/StateModifier')
            const modifier = getStateModifier(nowPlayer)
            if (!modifier.getState(stateKey)) {
                addOutput(`玩家没有状态: ${stateKey}`, 'error')
                return
            }
            modifier.removeState(stateKey)
            addOutput(`✓ 已移除玩家状态: ${stateKey}`, 'result')
        }
    }
]
