/**
 * 开发者控制台命令注册系统
 * 支持 mod 制作者注册自定义命令
 */

export interface ConsoleCommand {
    name: string
    description: string
    usage: string
    examples?: string[]
    execute: (args: any[], addOutput: (text: string, type?: 'result' | 'error' | 'info') => void) => Promise<void> | void
}

class ConsoleCommandRegistry {
    private commands: Map<string, ConsoleCommand> = new Map()

    /**
     * 注册命令
     */
    registerCommand(command: ConsoleCommand) {
        if (this.commands.has(command.name)) {
            console.warn(`[ConsoleCommand] 命令 "${command.name}" 已存在，将被覆盖`)
        }
        this.commands.set(command.name, command)
    }

    /**
     * 批量注册命令
     */
    registerCommands(commands: ConsoleCommand[]) {
        commands.forEach(cmd => this.registerCommand(cmd))
    }

    /**
     * 获取命令
     */
    getCommand(name: string): ConsoleCommand | undefined {
        return this.commands.get(name)
    }

    /**
     * 获取所有命令
     */
    getAllCommands(): ConsoleCommand[] {
        return Array.from(this.commands.values())
    }

    /**
     * 移除命令
     */
    removeCommand(name: string): boolean {
        return this.commands.delete(name)
    }

    /**
     * 清空所有命令
     */
    clear() {
        this.commands.clear()
    }
}

// 导出单例
export const consoleCommandRegistry = new ConsoleCommandRegistry()

/**
 * 便捷函数：注册命令
 */
export function registerConsoleCommand(command: ConsoleCommand) {
    consoleCommandRegistry.registerCommand(command)
}

/**
 * 便捷函数：批量注册命令
 */
export function registerConsoleCommands(commands: ConsoleCommand[]) {
    consoleCommandRegistry.registerCommands(commands)
}
