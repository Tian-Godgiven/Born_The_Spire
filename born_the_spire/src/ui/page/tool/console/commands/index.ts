import { consoleCommandRegistry } from '@/core/utils/consoleCommandRegistry'
import { roomCommands } from './room'
import { battleCommands } from './battle'
import { cardCommands } from './card'
import { potionCommands } from './potion'
import { relicCommands } from './relic'
import { organCommands } from './organ'
import { debugCommands } from './debug'

/** 注册所有内置控制台命令 */
export function registerAllCommands() {
    // 注册分组（控制帮助中的显示顺序和标题）
    consoleCommandRegistry.registerGroups([
        { key: '房间', title: '房间命令' },
        { key: '事件', title: '事件调试命令' },
        { key: '战斗', title: '战斗调试命令' },
        { key: '遗物', title: '遗物系统命令' },
        { key: '器官', title: '器官系统命令' },
        { key: '卡牌', title: '卡牌命令' },
        { key: '药水', title: '药水命令' },
        { key: '临时物品', title: '临时物品命令' },
        { key: '主动', title: '主动能力命令' },
        { key: '调试', title: '调试工具命令' },
        { key: '黑市', title: '黑市相关命令' },
        { key: '水池', title: '水池相关命令' },
    ])

    // 注册所有命令
    consoleCommandRegistry.registerCommands([
        ...roomCommands,
        ...battleCommands,
        ...cardCommands,
        ...potionCommands,
        ...relicCommands,
        ...organCommands,
        ...debugCommands,
    ])
}
