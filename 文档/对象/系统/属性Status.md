# 属性

属性指的是实体所拥有的各类固有特质的数值。这类特质会在游戏全局或战斗中被修改，从而造成一定影响。
常见的属性包括：最大生命，最大能量，回合抽牌数，伤害倍率等，这些属性并不会频繁修改，且这类修改往往可以被撤回。
为了记录属性修改的来源，并且可以操作修改本身的撤销或添加，以及这类行为导致的计算，属性会使用“属性修饰器”来管理。

PS:对于“当前生命”，“当前能量”等频繁变化、且与事务强相关，最关键的是几乎没有撤销行为的数值，我们使用“资源resource”来进行管理

# 属性修饰器

用于统一管理实体的属性的基础值与当前值的变化。包括增删改，以及该过程中对属性的重新计算等功能。
通过添加/移除修饰器，来对属性的值进行操作。

修饰器的作用层级大致分为基础层和当前层
基础层的变动会长期保留（在游戏全局中不会自动清理）
当前层的变动会要求定义清除时机

## 修饰器结构

属性修饰器对象包含如下字段：
```
{
    id: string,                 // 唯一标识
    source: any,                // 来源对象（卡牌/器官/遗物/事件等）
    statusKey: string,          // 作用的属性键

    // 分层
    targetLayer: "base" | "current",

    // 计算类型
    modifierType: "additive" | "multiplicative" | "final",

    // 应用模式
    applyMode: "absolute" | "snapshot",

    // 顺序与持续
    timestamp: number,              // 添加顺序（或时间戳/序号）
    duration: "permanent" | "battle" | "turn" | "next_turn_start",

    // 快照（按需记录）
    snapshotValue?: number,     // 添加当下“当前值”快照（current层常用）
    snapshotBaseValue?: number, // 添加当下“基础值”快照（差值计算可用）

    // 取值/计算
    // 对于 additive：value 表示加/减的数值
    // 对于 multiplicative：value 表示倍率（如 2、1.5）
    value: number,
}
```
## 计算流程（refresh）

属性在新增、删除、修改修饰器时，会重新计算（refresh）

1. 计算基础值层（Base Layer）
   - 取初始基础值 `base = defaultValue`（可视为基础修饰器的结果）。
   - 收集所有 `targetLayer = base` 的修饰器，按 `timestamp` 升序：
     - additive + absolute：`base += value`
     - multiplicative + snapshot：
       - 首次添加时记录 `snapshotBaseValue = baseAtAdd`
       - 差值计算：`base = base + snapshotBaseValue * (multiplier - 1)`
     - final：在本层用于最终形态调整（如边界收敛/取整）。

2. 计算当前值层（Current Layer）
   - 以基础值作为起点：`current = base`
   - 收集所有 `targetLayer = current` 的修饰器，按 `timestamp` 升序：
     - additive + absolute：`current += value`
     - additive + snapshot：
       - 首次添加时记录 `snapshotValue = currentAtAdd`
       - 计算：`current = snapshotValue + value`
     - multiplicative + snapshot：
       - 首次添加时记录 `snapshotValue` 与 `snapshotBaseValue`
       - 差值计算：`current = base + snapshotValue * (multiplier - 1)`
     - final：在本层用于最终形态调整（如 clamp/取整）。

3. 写回：
   - `Status.defaultValue = base`
   - `Status.value = current`

说明：
- “乘以倍数”的 snapshot 采用“差值”思路以保持直觉：
  - 当前层：`current = base + snapshotValue * (multiplier - 1)`
  - 基础层：`base = base + snapshotBaseValue * (multiplier - 1)`
- additive 的 snapshot 体现“基于当时值的即时修改且保持”：`current = snapshotValue + value`


## 示例流程（与顺序依赖）

初始：基础=100，当前=100

1) 添加 A：“当前生命x2（战斗结束撤销）”，`current/multiplicative/snapshot/timestamp=1/duration=battle`
- 记录：`snapshotValue = 100`
- 计算：`current = base + snapshotValue * (2 - 1) = 100 + 100 = 200`
- 状态：基础=100，当前=200

2) 添加 B：“基础生命+10（永久）”，`base/additive/absolute/timestamp=2/duration=permanent`
- 基础层：`base = 100 + 10 = 110`
- 当前层（重算 A）：`current = base + snapshotValue * (2 - 1) = 110 + 100 = 210`
- 状态：基础=110，当前=210

3) 添加 C：“当前生命+10（到下回合开始撤销）”，`current/additive/snapshot/timestamp=3/duration=next_turn_start`
- 记录：`snapshotValue = 210`
- 当前层：`current = 210 + 10 = 220`
- 状态：基础=110，当前=220

4) 下回合开始：移除 C，重算
- 基础层：`base = 110`
- 当前层（A 重算）：`current = 110 + 100 = 210`
- 状态：基础=110，当前=210

5) 战斗结束：移除 A，重算
- 基础层：`base = 110`
- 当前层：`current = base = 110`
- 状态：基础=110，当前=110


## API 与约定

### 核心函数

#### appendStatus(entity, status)
添加属性到实体。不允许重复添加同一个 key 的属性。

```typescript
const status = createStatusFromMap(entity, "max-health", 100)
appendStatus(entity, status)
```

**重要**：必须使用 `markRaw()` 包装 Status 对象，防止被 Vue 的 reactive 系统破坏：
```typescript
entity.status[key] = markRaw(status)
```

#### ensureStatusExists(entity, statusKey, initialValue)
确保实体具备某个属性，如果不存在则创建。这是一个安全的辅助函数。

```typescript
// 确保玩家有 ifBloodMark 属性
ensureStatusExists(nowPlayer, "ifBloodMark", 0)

// 之后可以安全地修改
changeStatusValue(nowPlayer, "ifBloodMark", source, {
    target: "base",
    type: "additive",
    value: 1
})
```

**实现细节**：
- 使用 `createStatusFromMap()` 创建 Status 对象
- 自动添加默认值修饰器
- 使用 `markRaw()` 保护 Status 对象不被 reactive 破坏

#### changeStatusValue(entity, statusKey, source, options)
为目标的属性值添加新的修饰器，返回移除函数。

**参数说明**：
- `entity`: 目标实体
- `statusKey`: 属性键名（字符串）
- `source`: 修饰器来源对象（**注意**：这是第三个参数，不是对象）
- `options`: 配置对象
  - `value`: 修改值
  - `type`: 修饰器类型（"additive" | "multiplicative"，默认 "additive"）
  - `target`: 目标层级（"base" | "current"，默认 "base"）
  - `modifierFunc`: 可选的修饰函数

**正确用法**：
```typescript
// ✅ 正确 - source 是第三个参数
changeStatusValue(player, "max-health", organ, {
    value: 10,
    type: "additive",
    target: "base"
})

// ❌ 错误 - 不要传递对象作为 source
changeStatusValue(player, "max-health", { source: organ, medium: card }, {
    value: 10
})
```

**返回值**：
返回一个移除函数，调用后会移除该修饰器并重新计算属性值。

```typescript
const remove = changeStatusValue(player, "max-health", organ, { value: 10 })
// 稍后移除
remove()
```

#### getStatusValue(entity, statusKey, defaultValue?)
获取目标属性的当前值。如果目标不具备这个属性，返回 defaultValue（如果提供），否则报错。

```typescript
const maxHealth = getStatusValue(player, "max-health")
const bloodMark = getStatusValue(player, "ifBloodMark", 0)  // 不存在时返回 0
```

#### getStatusRefValue(entity, statusKey)
获取目标属性的响应式值（ref）。用于 Vue 组件中需要响应式更新的场景。

```typescript
const maxHealthRef = getStatusRefValue(player, "max-health")
// 在 Vue 模板中会自动解包
```

### Vue 响应式系统注意事项

**问题**：Entity 对象被 `reactive()` 包装后，Vue 会递归转换所有嵌套对象。Status 对象内部有 `_baseValue = ref(0)` 和 `_value = ref(0)`，如果被 reactive 处理，这些 ref 会被"解包"成普通数字，导致错误。

**解决方案**：使用 `markRaw()` 标记 Status 对象，告诉 Vue 跳过响应式转换。

```typescript
// 在 appendStatus 中
entity.status[key] = markRaw(status)

// 在 ensureStatusExists 中
entity.status[statusKey] = markRaw(status)
```

**错误示例**：
```
TypeError: Cannot create property 'value' on number '50'
```
这个错误表示 `_baseValue` 被转换成了数字 50，而不是 ref 对象。

**何时使用 markRaw**：
- ✅ Status 对象添加到 entity.status 时
- ✅ 任何包含内部 ref/reactive 结构的对象
- ❌ Entity 本身（Entity 需要是 reactive 的）
- ❌ 简单的数据对象

### 旧版 API（已废弃）

- 添加：`addStatusModifier(target, statusKey, modifier)`
  - 分配 `timestamp`（时间序或自增序号）。
  - 首次添加时按需记录快照（`snapshotValue/snapshotBaseValue`）。
  - 添加后立即 `refresh()`。

- 移除：`removeStatusModifier(target, statusKey, modifierId)`
  - 移除后立即 `refresh()`。

- 清理：
  - 回合/战斗阶段边界调用：`removeByDuration(target, statusKey, duration)` → `refresh()`。

- 只读：外部禁止直接写 `Status.value`，统一通过修饰器 + `refresh()` 维护一致性。

# 实体的属性

属性Status作为实体的重要属性之一，通常会在实体构建时为其创建一些默认的属性，这些属性以如下结构定义在实体的数据内

Entity:{
  status:{
    key:{//该属性的key值
      label?:string,//该属性的label值
      
    }

  }
}