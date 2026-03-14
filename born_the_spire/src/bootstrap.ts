/**
 * 应用启动文件
 *
 * 这个文件确保核心类在其他模块之前加载
 */

console.log('[Bootstrap] 开始启动应用')

// 第一步：预加载核心类
console.log('[Bootstrap] 步骤 1: 预加载核心类')
await import('@/core/preload')

// 第二步：初始化懒加载模块注册（必须在核心类加载后）
console.log('[Bootstrap] 步骤 2: 初始化懒加载模块注册')
const { initLazyModuleRegistrations } = await import('@/core/utils/lazyLoader')
initLazyModuleRegistrations()

console.log('[Bootstrap] 步骤 3: 加载主应用')
// 第三步：加载主应用
await import('./main')

console.log('[Bootstrap] 应用启动完成')
