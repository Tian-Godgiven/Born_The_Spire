/**
 * Mod 系统主入口
 * 注册并加载所有 mod
 */

import { modLoader } from './ModLoader'
import { xdnmbMod } from './xdnmb'

/**
 * 注册所有内置 mod
 */
function registerAllMods(): void {
    modLoader.registerMod(xdnmbMod)
}

/**
 * 加载所有 mod（在懒加载完成后调用）
 */
export async function loadAllMods(): Promise<void> {
    registerAllMods()
    await modLoader.loadAllMods()
}
