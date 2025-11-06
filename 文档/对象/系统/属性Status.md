# 属性

指的是实体所拥有的各类固有特质的数值。

属性值的存在意义是



属性通常通过“changeStateValue”事件发生改变，但部分重要的属性有独特的接口(虽然根本上还是通过changeStateValue)

例如：
=>生命值：增加：heal（回复生命）
        减少：lostHeal（失去生命）
=>能量：恢复能量：resource（回合开始时恢复能量）
      消耗能量：costEnergy（使用卡牌时消耗能量）


### 物质/生命 matter

显示在对象的生命值区域
几乎所有目标都具备该属性

- 对玩家角色来说，若其物质属性的值为0，则会在绝大部分情况判定游戏失败。
- 对敌方角色来说，若其物质属性的值为0，则会在绝大部分情况判定击败敌方（敌方死亡）。
- 对器官来说，若其物质属性的值为0，则会在绝大部分情况判定为器官损坏。


# 构建属性对象

在创建一个对象时，会根据其status值构建相应的属性对象

[toc]

# 属性修饰器（简化版）

本篇文档定义“简化后的属性修饰器系统”，用于统一管理对象属性的基础值与当前值的变化，支持顺序依赖与快照计算，舍弃属性层面的独立乘区与 relative 聚合，聚焦于当前项目的实际需求与维护成本。

目标：
- 仅通过修饰器修改属性，`value` 不被直接写入。
- 区分基础值层与当前值层的计算。
- 支持“即时修改当前值”的顺序依赖（snapshot）。
- 支持不同持续时间（永久/战斗内/回合内/到下回合开始）的自动清理。


## 术语与分层

- 基础值层（Base Layer）：对应 `Status.defaultValue` 的来源与长期变动（如器官带来的“基础生命+10”）。
- 当前值层（Current Layer）：对应 `Status.value` 的对局内或阶段性变动（如“当前生命x2（战斗结束撤销）”“当前生命+10（下回合开始撤销）”）。
- 修饰器（Modifier）：描述一次对属性的变更意图，添加/移除修饰器触发重算。
- 快照（Snapshot）：修饰器在“添加当下”记录的参考值，用于保证顺序依赖（后加效果基于当时值进行计算，而非基于最终值）。


## 修饰器结构

属性修饰器对象建议包含如下字段（示意）：

```
{
    // 基本
    id: string,                 // 唯一标识
    source: any,                // 来源对象（卡牌/器官/遗物/事件等）
    statusKey: string,          // 作用的属性键

    // 分层
    targetLayer: "base" | "current",

    // 计算类型（仅保留必要的两类）
    modifierType: "additive" | "multiplicative" | "final",

    // 应用模式（仅保留 absolute 与 snapshot）
    applyMode: "absolute" | "snapshot",

    // 顺序与持续
    order: number,              // 添加顺序（或时间戳/序号）
    duration: "permanent" | "battle" | "turn" | "next_turn_start",

    // 快照（按需记录）
    snapshotValue?: number,     // 添加当下“当前值”快照（current层常用）
    snapshotBaseValue?: number, // 添加当下“基础值”快照（差值计算可用）

    // 取值/计算
    // 对于 additive：value 表示加/减的数值
    // 对于 multiplicative：multiplier 表示倍率（如 2、1.5）
    value?: number,
    multiplier?: number,
}
```

说明：
- 不在属性系统中实现“独立乘区/relative 聚合”。若未来需要，可在保持字段兼容的前提下扩展，不影响现有逻辑。


## 计算流程（refresh）

属性的 `refresh()` 负责以幂等方式计算：

1. 计算基础值层（Base Layer）
   - 取初始基础值 `base = defaultValue`（可视为基础修饰器的结果）。
   - 收集所有 `targetLayer = base` 的修饰器，按 `order` 升序：
     - additive + absolute：`base += value`
     - multiplicative + snapshot：
       - 首次添加时记录 `snapshotBaseValue = baseAtAdd`
       - 差值计算：`base = base + snapshotBaseValue * (multiplier - 1)`
     - final：在本层用于最终形态调整（如边界收敛/取整）。

2. 计算当前值层（Current Layer）
   - 以基础值作为起点：`current = base`
   - 收集所有 `targetLayer = current` 的修饰器，按 `order` 升序：
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

1) 添加 A：“当前生命x2（战斗结束撤销）”，`current/multiplicative/snapshot/order=1/duration=battle`
- 记录：`snapshotValue = 100`
- 计算：`current = base + snapshotValue * (2 - 1) = 100 + 100 = 200`
- 状态：基础=100，当前=200

2) 添加 B：“基础生命+10（永久）”，`base/additive/absolute/order=2/duration=permanent`
- 基础层：`base = 100 + 10 = 110`
- 当前层（重算 A）：`current = base + snapshotValue * (2 - 1) = 110 + 100 = 210`
- 状态：基础=110，当前=210

3) 添加 C：“当前生命+10（到下回合开始撤销）”，`current/additive/snapshot/order=3/duration=next_turn_start`
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

- 添加：`addStatusModifier(target, statusKey, modifier)`
  - 分配 `order`（时间序或自增序号）。
  - 首次添加时按需记录快照（`snapshotValue/snapshotBaseValue`）。
  - 添加后立即 `refresh()`。

- 移除：`removeStatusModifier(target, statusKey, modifierId)`
  - 移除后立即 `refresh()`。

- 清理：
  - 回合/战斗阶段边界调用：`removeByDuration(target, statusKey, duration)` → `refresh()`。

- 只读：外部禁止直接写 `Status.value`，统一通过修饰器 + `refresh()` 维护一致性。


## 兼容与扩展

- 兼容：保留 `modifierType: "final"` 以满足尾部收敛/取整等需求。
- 扩展：如未来需要属性层面的独立乘区/relative 聚合，可增补：
  - `applyMode: "relative"` 与 `groupId: string`
  - 在 refresh 流程中为 relative 新增“分组聚合”步骤
  - 该扩展对现有 absolute/snapshot 语义无影响


## 实践建议

1. 80% 情况仅需：`base/additive/absolute` 与 `current/(additive|multiplicative)/snapshot`。
2. 保持修饰器原子化与最小职责，便于追踪来源与撤销。
3. 明确边界清理策略（回合/战斗），避免“遗留修饰器”。
4. 日志/调试：记录每次 `refresh()` 的输入/输出与参与的修饰器列表，有助排查顺序依赖问题。


