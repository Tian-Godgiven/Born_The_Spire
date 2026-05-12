/**
 * 开发者控制台命令注册系统
 * 支持 mod 制作者注册自定义命令
 */

export type AddOutputFn = (text: string, type?: 'result' | 'error' | 'info' | 'example', clickable?: string, action?: () => void) => void

export interface ConsoleCommand {
    /** 命令名称（即调用时的函数名） */
    name: string
    /** 所属分组（用于 help 显示） */
    group: string
    /** 命令描述 */
    description: string
    /** 用法示例（显示在帮助中） */
    usage: string
    /** 示例命令列表 */
    examples?: string[]
    /** 执行函数 */
    execute: (args: any[], addOutput: AddOutputFn) => Promise<void> | void
}

/** 分组显示顺序和标题 */
export interface CommandGroup {
    key: string
    title: string
}

class ConsoleCommandRegistry {
    private commands: Map<string, ConsoleCommand> = new Map()
    private groups: CommandGroup[] = []

    registerCommand(command: ConsoleCommand) {
        if (this.commands.has(command.name)) {
            console.warn(`[ConsoleCommand] 命令 "${command.name}" 已存在，将被覆盖`)
        }
        this.commands.set(command.name, command)
    }

    registerCommands(commands: ConsoleCommand[]) {
        commands.forEach(cmd => this.registerCommand(cmd))
    }

    /** 注册分组（控制显示顺序和标题） */
    registerGroup(group: CommandGroup) {
        if (!this.groups.find(g => g.key === group.key)) {
            this.groups.push(group)
        }
    }

    registerGroups(groups: CommandGroup[]) {
        groups.forEach(g => this.registerGroup(g))
    }

    getCommand(name: string): ConsoleCommand | undefined {
        return this.commands.get(name)
    }

    getAllCommands(): ConsoleCommand[] {
        return Array.from(this.commands.values())
    }

    /** 获取按分组整理的命令，用于生成帮助 */
    getCommandsByGroup(): { group: CommandGroup, commands: ConsoleCommand[] }[] {
        const result: { group: CommandGroup, commands: ConsoleCommand[] }[] = []
        const groupedKeys = new Set<string>()

        // 按注册顺序的分组
        for (const group of this.groups) {
            const cmds = this.getAllCommands().filter(c => c.group === group.key)
            if (cmds.length > 0) {
                result.push({ group, commands: cmds })
                groupedKeys.add(group.key)
            }
        }

        // 未注册分组的命令归到杂项
        const ungrouped = this.getAllCommands().filter(c => !groupedKeys.has(c.group))
        if (ungrouped.length > 0) {
            result.push({ group: { key: '其他', title: '其他命令' }, commands: ungrouped })
        }

        return result
    }

    getGroups(): CommandGroup[] {
        return [...this.groups]
    }

    removeCommand(name: string): boolean {
        return this.commands.delete(name)
    }

    clear() {
        this.commands.clear()
        this.groups = []
    }
}

// 导出单例
export const consoleCommandRegistry = new ConsoleCommandRegistry()

export function registerConsoleCommand(command: ConsoleCommand) {
    consoleCommandRegistry.registerCommand(command)
}

export function registerConsoleCommands(commands: ConsoleCommand[]) {
    consoleCommandRegistry.registerCommands(commands)
}
