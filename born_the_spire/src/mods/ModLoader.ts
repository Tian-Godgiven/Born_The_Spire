/**
 * Mod 加载器
 * 负责管理和加载所有 mod
 */

export interface ModConfig {
    id: string
    name: string
    version: string
    author?: string
    description?: string
}

export interface Mod {
    config: ModConfig
    load: () => Promise<void>
}

class ModLoader {
    private mods: Map<string, Mod> = new Map()
    private loadedMods: Set<string> = new Set()

    /**
     * 注册一个 mod
     */
    registerMod(mod: Mod): void {
        if (this.mods.has(mod.config.id)) {
            console.warn(`[ModLoader] Mod ${mod.config.id} 已注册，跳过`)
            return
        }
        this.mods.set(mod.config.id, mod)
        console.log(`[ModLoader] 注册 mod: ${mod.config.name} (${mod.config.id})`)
    }

    /**
     * 加载所有已注册的 mod
     */
    async loadAllMods(): Promise<void> {
        console.log(`[ModLoader] 开始加载 ${this.mods.size} 个 mod...`)

        for (const [id, mod] of this.mods) {
            try {
                await mod.load()
                this.loadedMods.add(id)
                console.log(`[ModLoader] ✓ 加载成功: ${mod.config.name}`)
            } catch (error) {
                console.error(`[ModLoader] ✗ 加载失败: ${mod.config.name}`, error)
            }
        }

        console.log(`[ModLoader] 加载完成: ${this.loadedMods.size}/${this.mods.size}`)
    }

    /**
     * 获取已加载的 mod 列表
     */
    getLoadedMods(): ModConfig[] {
        return Array.from(this.loadedMods)
            .map(id => this.mods.get(id)?.config)
            .filter(Boolean) as ModConfig[]
    }
}

export const modLoader = new ModLoader()
