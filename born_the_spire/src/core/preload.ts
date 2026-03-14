/**
 * 核心类预加载
 *
 * 使用动态导入确保按顺序加载，避免循环依赖
 */

console.log('🔵 [Preload] 开始预加载核心类')

// ==================== 第 1 层：最基础的类 ====================
console.log('[Preload] 第 1 层: 加载 Entity')
await import('@/core/objects/system/Entity')
console.log('[Preload] Entity 加载完成')

// ==================== 第 2 层：Entity 的直接依赖 ====================
console.log('[Preload] 第 2 层: 加载 Entity 依赖')
await Promise.all([
    import('@/core/objects/system/State'),
    import('@/core/objects/system/Current/current'),
    import('@/core/objects/system/status/Status'),
    import('@/core/objects/system/trigger/Trigger'),
    import('@/core/objects/system/ActionEvent'),
    import('@/core/objects/system/effect/Effect'),
    import('@/core/objects/system/effect/EffectUnit')
])
console.log('[Preload] 第 2 层加载完成')

// ==================== 第 3 层：修饰器系统 ====================
console.log('[Preload] 第 3 层: 加载修饰器系统')

await import('@/core/objects/system/modifier/Modifier')
console.log("ModifierOk")
await import('@/core/objects/system/status/StatusModifier')
console.log("StatusOk")
await import('@/core/objects/system/modifier/ContentModifier')
console.log("contentOk")
await import('@/core/objects/system/modifier/StateModifier')
console.log('StateOk')

console.log('[Preload] 第 3 层加载完成')

// ==================== 第 4 层：目标类和物品类（按继承链） ====================
console.log('[Preload] 第 4 层: 加载 Target')
await import('@/core/objects/target/Target')
console.log('[Preload] Target 加载完成')

console.log('[Preload] 第 4 层: 加载 Organ')
await import('@/core/objects/target/Organ')
console.log('[Preload] Organ 加载完成')

console.log('[Preload] 第 4 层: 加载 Item')
await import('@/core/objects/item/Item')
console.log('[Preload] Item 加载完成')

console.log('[Preload] 第 4 层: 加载 Card, Relic, Potion')
await Promise.all([
    import('@/core/objects/item/Subclass/Card'),
    import('@/core/objects/item/Subclass/Relic'),
    import('@/core/objects/item/Subclass/Potion')
])
console.log('[Preload] Card, Relic, Potion 加载完成')

console.log('[Preload] 第 4 层: 加载 OrganModifier')
await import('@/core/objects/system/modifier/OrganModifier')
console.log('[Preload] OrganModifier 加载完成')

console.log('[Preload] 第 4 层: 加载 Enemy, Player')
await Promise.all([
    import('@/core/objects/target/Enemy'),
    import('@/core/objects/target/Player')
])
console.log('[Preload] Enemy, Player 加载完成')

// ==================== 第 5 层：物品相关的修饰器 ====================
console.log('[Preload] 第 5 层: 加载物品修饰器')
await Promise.all([
    import('@/core/objects/system/modifier/ItemModifier'),
    import('@/core/objects/system/modifier/CardModifier'),
    import('@/core/objects/system/modifier/RelicModifier'),
    import('@/core/objects/system/modifier/PotionModifier')
])
console.log('[Preload] 第 5 层加载完成')

// ==================== 第 6 层：其他系统类 ====================
console.log('[Preload] 第 6 层: 加载其他系统类')
await Promise.all([
    import('@/core/objects/system/GameRun'),
    import('@/core/objects/system/FloorManager'),
    import('@/core/objects/system/Entry'),
    import('@/core/objects/system/entry/CardEntry'),
    import('@/core/objects/system/entry/OrganEntry'),
    import('@/core/objects/system/modifier/EntryModifier')
])
console.log('[Preload] 第 6 层加载完成')

// ==================== 完成 ====================
console.log('✅ [Preload] 核心类预加载完成')

export const preloadComplete = true
