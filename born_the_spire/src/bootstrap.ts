/**
 * 应用启动文件
 *
 * 这个文件确保核心类在其他模块之前加载
 */

// 第一步：预加载核心类
await import('@/core/preload')

// 第二步：初始化懒加载模块注册（必须在核心类加载后）
const { initLazyModuleRegistrations } = await import('@/core/utils/lazyLoader')
initLazyModuleRegistrations()

// 第三步：加载主应用
await import('./main')
