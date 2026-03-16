# 游戏机制系统（Mechanism System）开发日志

## 开发日期
2026-02-05

## 背景

在讨论护甲系统实现时，发现护甲不只是一个简单的数值，而是代表了一类"会干扰游戏进程 + 需要UI显示"的机制。因此决定设计一个通用的**游戏机制系统**，让mod作者可以添加类似的机制（护甲、能量护盾、格挡层数等）。

## 核心概念

**游戏机制（Mechanism）**是一种具有以下特征的系统：
1. **干扰游戏进程**：在特定时机介入游戏逻辑（如护甲在受到伤害时吸收伤害）
2. **UI显示**：需要在界面上实时显示状态值
3. **可扩展**：Mod作者可以注册新的机制类型

类似的机制还有：
- 能量系统：干扰出牌（消耗能量），UI显示能量条
- 格挡层数：干扰伤害计算，UI显示层数
- 充能系统：干扰技能释放，UI显示充能数

## 系统架构

### 优先级投票系统

机制的启用/禁用采用**优先级投票系统**：
- 每个来源（遗物、buff、debuff等）可以投票"启用"或"禁用"机制
- **优先级最高的投票决定最终状态**
- 不考虑时间顺序，只看优先级

**示例：**
```typescript
// 场景1：高优先级启用
relicA (priority: 100) → enable 护甲
relicB (priority: 50) → enable 护甲
→ 护甲生效（优先级100说enable）

// 场景2：高优先级禁用
debuffA (priority: 100) → disable 护甲
relicB (priority: 50) → enable 护甲
→ 护甲失效（优先级100说disable，压制了50的enable）

// 场景3：移除高优先级后
移除 debuffA
relicB (priority: 50) → enable 护甲
→ 护甲恢复生效（50接管）
```

### 机制配置结构

每个机制包含三层配置：

**1. 数据层（Data Layer）**
- 定义数据存储位置（current、status、custom）
- 定义默认值

**2. 逻辑层（Logic Layer）**
- `absorbDamage`：吸收伤害行为
- `clear`：清零规则（回合结束、战斗结束等）
- `customTriggers`：自定义触发器

**3. UI层（UI Layer）**
- 显示位置（预设位置 + 自定义位置）
- 显示条件
- 显示组件

### 命名规范

**方案2：官方简短，Mod带前缀**
- 官方机制：使用简短名字（如 `armor`、`shield`）
- Mod机制：必须带前缀（如 `mod_modname_energyshield`）
- 机制key和存储key分离：
  - 机制key：`mod_mymod_armor`（唯一标识，带命名空间）
  - 存储key：`armor`（可自定义，保持简洁）

**待实现**：在Mod加载系统中添加命名规范检查（已记录到任务列表）

## 已实现内容

### 1. 类型定义

**文件：** `src/core/types/MechanismConfig.ts`

定义了完整的机制配置接口：
- `MechanismConfig`：机制完整配置
- `MechanismDataConfig`：数据存储配置
- `MechanismLogicConfig`：逻辑层配置
  - `AbsorbDamageBehavior`：吸收伤害行为
  - `ClearBehavior`：清零行为
  - `CustomTriggerConfig`：自定义触发器
- `MechanismUIConfig`：UI配置
  - `UIPosition`：预设显示位置

### 2. 机制管理器

**文件：** `src/core/objects/system/mechanism/MechanismManager.ts`

封装了单个实体的机制管理逻辑：
- `addVote()`：添加投票
- `removeVote()`：移除投票
- `getFinalVote()`：计算最终投票结果（优先级最高的）
- `setState()`：设置机制状态
- `getState()`：获取机制状态
- `addTriggers()`：添加触发器
- `removeTriggers()`：移除触发器
- `debug()`：调试信息

**优势：**
- 更好的可读性：Entity类只有一个 `mechanisms` 字段
- 更好的封装：所有逻辑封装在类中
- 符合现有模式：类似 StatusModifier、ContentModifier

### 3. 机制注册表

**文件：** `src/static/registry/mechanismRegistry.ts`

提供机制的注册和管理功能：
- `registerMechanism(config)`：注册机制配置
- `getMechanismConfig(key)`：获取机制配置
- `voteMechanismForEntity(entity, key, vote, source, priority)`：投票启用/禁用
- `removeVoteForEntity(entity, key, source)`：移除投票

**内部函数：**
- `updateMechanismState()`：根据投票计算并应用最终状态
- `enableMechanism()`：启用机制（创建数据、生成Triggers）
- `disableMechanism()`：禁用机制（移除Triggers）
- `createMechanismData()`：创建数据存储
- `generateTriggersForMechanism()`：自动生成触发器

**自动生成的Triggers：**
- 吸收伤害：`before take damage`
- 回合结束清零：`after make turnEnd`
- 战斗结束清零：`after make battleEnd`
- 受到伤害后清零：`after take damage`
- 自定义触发器：根据配置生成

### 4. Entity类修改

**文件：** `src/core/objects/system/Entity.ts`

添加了机制管理器字段：
```typescript
public mechanisms?: MechanismManager
```

### 5. 护甲机制实现

#### 5.1 护甲机制配置

**位置：** `src/static/registry/mechanismRegistry.ts`（底部）

```typescript
registerMechanism({
    key: "armor",
    label: "护甲",
    icon: "🛡️",
    description: "吸收伤害，回合结束时清零",

    data: {
        location: "current",
        key: "armor",
        defaultValue: 0
    },

    logic: {
        absorbDamage: {
            enabled: true,
            priority: 100,
            absorb: (armorValue, damageAmount, event) => {
                return Math.min(armorValue, damageAmount)
            }
        },
        clear: {
            onTurnEnd: true,
            onBattleEnd: true,
            onDamaged: false,
            duration: 0
        }
    },

    ui: {
        position: "healthBarRight",
        showWhen: (value) => value > 0,
        icon: "🛡️"
    }
})
```

**设计决策：**
- **100%吸收**：护甲完全吸收所有 `damage` 类型的伤害
- **不支持穿透**：如需无视护甲，应使用其他伤害类型（如 `trueDamage`）
- **回合结束清零**：每个角色自己回合结束时清零自己的护甲
- **优先级100**：留有调整空间
- **获得量修饰**：通过触发器实现（`before take gainArmor`），不在机制层面定义

#### 5.2 gainArmor效果函数

**文件：** `src/core/effects/gainArmor.ts`

```typescript
export const gainArmor: EffectFunc = (event, effect) => {
    const target = event.target as Target
    const amount = effect.params.value || 0

    if (amount <= 0) return

    if (!target.current.armor) {
        console.warn(`[gainArmor] ${target.label} 没有护甲机制`)
        return
    }

    target.current.armor.value += amount
    newLog([`${target.label} 获得了 ${amount} 点护甲`])
}
```

**注册到effectMap：** `src/static/list/system/effectMap.ts`

#### 5.3 默认启用护甲

**文件：** `src/core/objects/target/Target.ts`

在 `Chara` 构造函数中添加：
```typescript
// 启用护甲机制（默认启用）
voteMechanismForEntity(this, "armor", "enable", "default", 0)
```

所有 `Chara`（玩家、敌人）默认启用护甲机制。

## 待实现内容

### 1. UI显示组件（高优先级）

**需求：**
- 显示位置：血条右侧
- 显示样式：方块 + 盾牌图标🛡️ + 数值
- 显示条件：护甲 > 0 时显示
- 显示效果：`[生命值条 ████████] [🛡️ 10]`

**待实现：**
- 创建默认护甲显示组件
- 集成到角色UI中
- 支持动态更新（响应式）

### 2. 测试护甲功能（高优先级）

**测试内容：**
- 获得护甲（使用 gainArmor 效果）
- 护甲吸收伤害
- 回合结束清零
- 战斗结束清零
- 优先级投票系统（启用/禁用）

### 3. 创建护甲卡牌示例（中优先级）

**示例卡牌：**
```typescript
{
    key: "card_defend",
    label: "防御",
    cost: 1,
    describe: ["获得", { key: ["status", "armor"] }, "点护甲"],
    status: {
        armor: 5
    },
    interaction: {
        use: {
            target: { key: "self" },
            effects: [{
                key: "gainArmor",
                params: { value: 5 }
            }]
        }
    }
}
```

### 4. 护甲获得量修饰示例（低优先级）

**示例遗物：**
```typescript
{
    key: "relic_armor_boost",
    label: "护甲强化",
    describe: ["护甲获得+3"],
    interaction: {
        possess: {
            triggers: [{
                when: "before",
                how: "take",
                key: "gainArmor",
                callback: (event, effect) => {
                    effect.params.value += 3
                }
            }]
        }
    }
}
```

### 5. 其他机制示例（低优先级）

可以参考护甲机制实现其他类似机制：
- **能量护盾**：持续多回合，只吸收部分伤害
- **临时生命**：战斗结束清零，可被穿透伤害无视
- **格挡层数**：每次只消耗1层，不是按伤害值消耗

### 6. UI系统扩展（低优先级）

**预设位置支持：**
- `healthBarRight`：血条右侧（已定义）
- `characterTop`：角色头顶
- `characterBottom`：角色底部
- `sidebar`：侧边栏
- `topBar`：顶部栏
- `custom`：完全自定义

**组件系统：**
- 默认组件：简单的方块+图标+数值
- 自定义组件：支持传入Vue组件

## 技术要点

### 1. 干扰逻辑实现

**使用现有的Trigger系统**，不需要新的拦截器系统：
- 护甲吸收伤害：`before take damage` 触发器
- 回合结束清零：`after make turnEnd` 触发器
- 获得量修饰：`before take gainArmor` 触发器（由遗物/器官添加）

### 2. 数据存储

**动态添加字段**：
```typescript
// 在 enableMechanism 时动态创建
if (location === "current") {
    entity.current[storageKey] = ref(defaultValue)
}
```

**优势：**
- 不需要预定义所有可能的字段
- 支持Mod添加新的存储字段
- 保持响应式（使用 `ref()`）

### 3. Trigger生命周期管理

**追踪机制生成的Triggers：**
```typescript
// 生成Trigger时保存remove函数
const { remove } = entity.trigger.appendTrigger({ ... })
manager.addTriggers(mechanismKey, [{ remove }])

// 禁用机制时移除所有Triggers
manager.removeTriggers(mechanismKey)
```

**优势：**
- 精确控制Trigger的生命周期
- 避免Trigger泄漏
- 支持机制的临时启用/禁用

## 相关文件清单

### 核心系统文件
- `src/core/types/MechanismConfig.ts` - 机制配置类型定义
- `src/core/objects/system/mechanism/MechanismManager.ts` - 机制管理器
- `src/static/registry/mechanismRegistry.ts` - 机制注册表
- `src/core/objects/system/Entity.ts` - Entity类（添加mechanisms字段）

### 护甲机制文件
- `src/core/effects/gainArmor.ts` - 获得护甲效果
- `src/static/list/system/effectMap.ts` - 效果映射表（注册gainArmor）
- `src/core/objects/target/Target.ts` - Target类（默认启用护甲）

### 文档文件
- `文档/任务列表.md` - 添加了Mod机制命名规范任务

## 设计优势

1. **高度可扩展**：Mod作者可以注册任意类型的机制
2. **优先级系统**：灵活的启用/禁用控制，支持buff/debuff压制
3. **自动化**：自动生成Triggers，自动管理生命周期
4. **符合现有架构**：使用Trigger系统，使用Modifier模式
5. **声明式配置**：Mod作者只需配置，不需要写复杂代码
6. **UI可配置**：支持预设位置和自定义组件

## 下一步计划

1. **实现护甲UI显示**（血条右侧显示护甲值）
2. **测试护甲功能**（获得、吸收、清零）
3. **创建护甲卡牌示例**（防御卡）
4. **完善文档**（使用指南、Mod开发指南）
5. **实现其他机制**（能量护盾、临时生命等）

## 注意事项

1. **命名冲突**：Mod机制必须带前缀，需要在Mod加载系统中检查
2. **存储位置**：目前只实现了 `current` 存储，`status` 和 `custom` 待实现
3. **持续回合数**：清零规则中的 `duration` 功能待实现
4. **UI系统**：预设位置和自定义组件系统待实现
5. **性能考虑**：大量机制时的性能优化（如缓存、批量更新）

## 总结

今天成功设计并实现了**游戏机制系统**的核心架构，并完成了第一个机制——**护甲**的基础实现。系统采用优先级投票机制，支持灵活的启用/禁用控制，为未来扩展更多机制（能量护盾、格挡层数等）打下了良好的基础。

明天的工作重点是实现UI显示和测试功能，确保护甲机制能够正常工作并在界面上正确显示。
