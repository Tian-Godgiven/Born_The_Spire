/**
 * 懒加载工具
 * 用于延迟加载数据配置文件，避免在模块加载阶段形成循环依赖
 *
 * 使用场景：
 * - 核心系统类（Entity、ActionEvent 等）需要在模块加载时建立依赖
 * - 数据配置文件（effectMap、organList 等）只在运行时需要
 * - 通过懒加载，将数据加载延迟到运行时，打破循环依赖
 *
 * 重要：使用 ES6 动态 import() 而不是 require()
 * - import() 返回 Promise，支持 ES 模块
 * - require() 在 Vite/ES 模块环境中不可用
 */

type LazyModule<T> = {
    module: T | null
    loader: () => Promise<T>
    loading: Promise<T> | null
}

const lazyModules = new Map<string, LazyModule<any>>()

/**
 * 注册一个懒加载模块
 * @param key 模块的唯一标识
 * @param loader 加载函数，返回 Promise<模块内容>
 */
export function registerLazyModule<T>(key: string, loader: () => Promise<T>): void {
    lazyModules.set(key, {
        module: null,
        loader,
        loading: null
    })
}

/**
 * 获取懒加载模块（如果未加载则自动加载）
 * @param key 模块的唯一标识
 * @returns 模块内容（同步返回，如果未加载会抛出错误）
 */
export function getLazyModule<T>(key: string): T {
    const lazyModule = lazyModules.get(key)

    if (!lazyModule) {
        throw new Error(`懒加载模块未注册: ${key}`)
    }

    // 如果还未加载，抛出错误（需要先调用 preloadAllLazyModules）
    if (lazyModule.module === null) {
        throw new Error(`懒加载模块尚未加载: ${key}，请先调用 preloadAllLazyModules()`)
    }

    return lazyModule.module
}

/**
 * 异步获取懒加载模块（如果未加载则自动加载）
 * @param key 模块的唯一标识
 * @returns Promise<模块内容>
 */
export async function getLazyModuleAsync<T>(key: string): Promise<T> {
    const lazyModule = lazyModules.get(key)

    if (!lazyModule) {
        throw new Error(`懒加载模块未注册: ${key}`)
    }

    // 如果正在加载，等待加载完成
    if (lazyModule.loading) {
        return lazyModule.loading
    }

    // 如果已加载，直接返回
    if (lazyModule.module !== null) {
        return lazyModule.module
    }

    // 开始加载
    lazyModule.loading = lazyModule.loader()
    lazyModule.module = await lazyModule.loading
    lazyModule.loading = null

    return lazyModule.module
}

/**
 * 预加载所有已注册的懒加载模块
 * 应该在游戏启动时调用，提前加载所有数据
 */
export async function preloadAllLazyModules(): Promise<void> {

    const promises: Promise<void>[] = []

    for (const [key, lazyModule] of lazyModules.entries()) {
        if (lazyModule.module === null && !lazyModule.loading) {
            const promise = (async () => {
                lazyModule.loading = lazyModule.loader()
                lazyModule.module = await lazyModule.loading
                lazyModule.loading = null
            })()
            promises.push(promise)
        }
    }

    await Promise.all(promises)
}

/**
 * 清除所有懒加载模块的缓存
 * 用于测试或热重载
 */
export function clearLazyModules(): void {
    for (const lazyModule of lazyModules.values()) {
        lazyModule.module = null
        lazyModule.loading = null
    }
}

// ==================== 注册所有数据层模块 ====================

/**
 * 注册 effectMap
 */
registerLazyModule('effectMap', async () => {
    const module = await import('@/static/list/system/effectMap')
    return module.effectMap
})

/**
 * 注册 organList
 */
registerLazyModule('organList', async () => {
    const module = await import('@/static/list/target/organList')
    return module.organList
})

/**
 * 注册 cardList
 */
registerLazyModule('cardList', async () => {
    const module = await import('@/static/list/item/cardList')
    return module.cardList
})

/**
 * 注册 relicList
 */
registerLazyModule('relicList', async () => {
    const module = await import('@/static/list/item/relicList')
    return module.relicList
})

/**
 * 注册 potionList
 */
registerLazyModule('potionList', async () => {
    const module = await import('@/static/list/item/potionList')
    return module.potionList
})

/**
 * 注册 enemyList
 */
registerLazyModule('enemyList', async () => {
    const module = await import('@/static/list/target/enemyList')
    return module.enemyList
})

/**
 * 注册 eventList
 */
registerLazyModule('eventList', async () => {
    const module = await import('@/static/list/room/event/eventList')
    return module.eventList
})

// 可以继续添加更多数据层模块...

