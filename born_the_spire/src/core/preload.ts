/**
 * 核心类预加载
 *
 * 使用动态导入确保按顺序加载，避免循环依赖
 */


// ==================== 第 1 层：最基础的类 ====================
await import('@/core/objects/system/Entity')

// ==================== 第 2 层：Entity 的直接依赖 ====================
await Promise.all([
    import('@/core/objects/system/State'),
    import('@/core/objects/system/Current/current'),
    import('@/core/objects/system/status/Status'),
    import('@/core/objects/system/trigger/Trigger'),
    import('@/core/objects/system/ActionEvent'),
    import('@/core/objects/system/effect/Effect'),
    import('@/core/objects/system/effect/EffectUnit')
])

// ==================== 第 3 层：修饰器系统 ====================

await import('@/core/objects/system/modifier/Modifier')
await import('@/core/objects/system/status/StatusModifier')
await import('@/core/objects/system/modifier/ContentModifier')
await import('@/core/objects/system/modifier/StateModifier')


// ==================== 第 4 层：目标类和物品类（按继承链） ====================
await import('@/core/objects/target/Target')

await import('@/core/objects/target/Organ')

await import('@/core/objects/item/Item')

await Promise.all([
    import('@/core/objects/item/Subclass/Card'),
    import('@/core/objects/item/Subclass/Relic'),
    import('@/core/objects/item/Subclass/Potion')
])

await import('@/core/objects/system/modifier/OrganModifier')

await Promise.all([
    import('@/core/objects/target/Enemy'),
    import('@/core/objects/target/Player')
])

// ==================== 第 5 层：物品相关的修饰器 ====================
await Promise.all([
    import('@/core/objects/system/modifier/ItemModifier'),
    import('@/core/objects/system/modifier/CardModifier'),
    import('@/core/objects/system/modifier/RelicModifier'),
    import('@/core/objects/system/modifier/PotionModifier')
])

// ==================== 第 6 层：其他系统类 ====================
await Promise.all([
    import('@/core/objects/system/GameRun'),
    import('@/core/objects/system/FloorManager'),
    import('@/core/objects/system/Entry'),
    import('@/core/objects/system/entry/CardEntry'),
    import('@/core/objects/system/entry/OrganEntry'),
    import('@/core/objects/system/modifier/EntryModifier')
])

// ==================== 完成 ====================

export const preloadComplete = true
export {}
