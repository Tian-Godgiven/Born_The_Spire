# 敌人AI系统

敌人的行为通过声明式的 `behavior` 配置驱动，无需编写回调函数。每回合开始时系统根据条件自动选牌，构建手牌并展示意图给玩家。

---

## behavior 结构

```typescript
behavior: {
    patterns: BehaviorPattern[],   // 条件行为列表
    fallback: BehaviorPattern,     // 所有条件不满足时的默认行为
    handSize?: number              // 每回合手牌数量，默认 5
}
```

每回合开始时，系统按 `priority` 从高到低遍历 `patterns`，找到第一个满足条件的 pattern 执行，全部不满足则执行 `fallback`。

---

## pattern 格式

```typescript
{
    priority?: number,             // 优先级，数字越大越先检查，默认 0
    intent?: IntentType,           // 意图类型（用于UI展示）
    condition?: BehaviorCondition, // 触发条件（不填则无条件，与 fallback 等价）
    action: {
        selector: CardSelector,    // 选牌过滤器
        mode?: ActionMode,         // 选牌模式
        weights?: Record<string, number>,  // 权重表（mode: "weighted" 时使用）
        sequence?: string[],       // 卡牌序列（mode: "sequence"/"loop" 时使用）
    },
    describe?: string              // 调试说明
}
```

intent 可选值：
  `"attack"` / `"defend"` / `"buff"` / `"debuff"` / `"heal"` / `"special"` / `"unknown"`

不填 intent 时，系统从所选卡牌的 tags 自动推导。

---

## condition 条件

所有字段可单独使用，也可组合（同时满足才触发）。

### 血量条件

```typescript
// 自身血量百分比
selfHealth: { below?: number, above?: number }

// 玩家血量百分比
playerHealth: { below?: number, above?: number }
```

示例：

```typescript
condition: { selfHealth: { below: 33 } }           // 血量低于33%
condition: { selfHealth: { above: 33, below: 67 } } // 血量33%-67%
condition: { playerHealth: { below: 50 } }          // 玩家血量低于50%
```

### 回合数条件

```typescript
turn: { equals?: number, above?: number, below?: number, mod?: [number, number] }
```

示例：

```typescript
condition: { turn: { equals: 1 } }     // 第1回合
condition: { turn: { above: 3 } }      // 第3回合之后
condition: { turn: { mod: [3, 0] } }   // 每3回合（第3、6、9...回合）
condition: { turn: { mod: [2, 1] } }   // 单数回合（第1、3、5...回合）
```

### 状态条件

```typescript
hasState: {
    target: "self" | "player",
    stateKey: string,
    stacks?: number   // 最少层数，默认 >0
}
```

示例：

```typescript
condition: { hasState: { target: "self", stateKey: "power", stacks: 3 } }
// 自身力量层数 >= 3
```

---

## action.selector 选牌过滤器

从所有可用卡牌中筛选候选集，多个字段同时满足才入选。

```typescript
selector: {
    key?: string,               // 指定具体卡牌 key
    tags?: string[],            // 标签（满足任一即可）
    organ?: string,             // 来自指定器官
    costRange?: [number, number], // 费用范围 [min, max]
}
```

示例：

```typescript
selector: { tags: ["attack"] }               // 所有攻击牌
selector: { tags: ["attack", "skill"] }      // 攻击牌或技能牌
selector: { key: "enemy_card_slam" }         // 指定卡牌
selector: { organ: "enemy_organ_core" }      // 来自指定器官的卡牌
selector: {}                                 // 不过滤，全部可用卡牌
```

---

## action.mode 选牌模式

选出候选集之后，按 mode 决定最终使用哪张：

```
"random"    — 随机选1张（默认）
"weighted"  — 按权重随机，weights 字段指定各卡牌的权重
"loop"      — 按 sequence 顺序循环，每次行动取下一张
"sequence"  — 执行完一轮后停在末尾不再循环
```

weighted 示例：

```typescript
action: {
    selector: { tags: ["attack"] },
    mode: "weighted",
    weights: {
        "enemy_card_heavy_slam": 3,   // 权重3
        "enemy_card_quick_hit": 1     // 权重1（出现概率低）
    }
}
```

loop 示例（法师：攻击→强化→攻击→强化循环）：

```typescript
action: {
    selector: {},
    mode: "loop",
    sequence: ["enemy_card_fire_bolt", "enemy_card_power_up"]
}
```

---

## 多次行动（actions-per-turn）

通过 status 字段设置每回合行动次数：

```typescript
status: {
    "max-health": 80,
    "actions-per-turn": 2   // 每回合行动2次，默认1次
}
```

每次行动独立走一遍 pattern 选择流程，各自选出一张牌，加入手牌。意图只展示第一次行动选出的牌。

---

## 双牌堆系统

敌人有两个牌堆：

```
drawPile.actions  — 本回合行动牌（由 behavior 选出，每回合刷新）
drawPile.junk     — 垃圾牌（如减益牌，随机插入手牌，未抽到则留到下回合）
```

手牌构建流程：
  将 actions 和 junk 合并后随机洗牌
  抽取 handSize 张（默认5张）
  行动牌按原始 order 顺序排列
  垃圾牌随机插入行动牌序列中

未抽到的 junk 牌留到下回合继续参与洗牌，actions 每回合完全刷新。

往 junk 里塞牌（如 stuffCard 效果），会在下次洗牌时混入手牌，干扰敌人行动。

---

## 多阶段 Boss

没有专门的"换相"机制，通过血量条件配合高优先级 pattern 实现：

```typescript
behavior: {
    patterns: [
        {
            priority: 10,
            intent: "buff",
            condition: { selfHealth: { above: 66 } },    // 第一阶段 >66%
            action: { selector: { tags: ["power"] }, mode: "random" },
            describe: "第一阶段：蓄力"
        },
        {
            priority: 10,
            intent: "attack",
            condition: { selfHealth: { above: 33, below: 67 } },  // 第二阶段
            action: { selector: { tags: ["attack"] }, mode: "weighted",
                      weights: { "boss_card_slam": 3 } },
            describe: "第二阶段：猛攻"
        },
        {
            priority: 10,
            intent: "attack",
            condition: { selfHealth: { below: 33 } },    // 第三阶段 <33%
            action: { selector: { tags: ["attack"] }, mode: "random" },
            describe: "第三阶段：狂暴"
        }
    ],
    fallback: {
        intent: "attack",
        action: { selector: { tags: ["attack"] }, mode: "random" }
    }
}
```

每个阶段独占一个高优先级 pattern，通过血量范围区分，回合数低优先级 pattern 仍可在各阶段内叠加生效。

---

## 器官损坏的影响

器官损坏后：
  器官提供的卡牌被禁用（isDisabled = true），不再进入可用卡牌列表
  器官的 work 触发器被移除，broken 触发器激活
  器官的 break interaction 效果触发一次

若损坏后所有卡牌都不可用，敌人会自动使用兜底卡牌 `"fallback_struggle"`。

---

## 完整敌人定义示例

三阶段精英，第1回合强化，每3回合使用技能，平时攻击：

```typescript
{
    label: "古树守卫",
    key: "enemy_elite_tree_guardian",
    status: {
        "max-health": 120,
        "actions-per-turn": 1
    },
    organ: [
        "organ_tree_bark",    // 提供护甲牌和防御被动
        "organ_tree_root"     // 提供攻击牌
    ],
    behavior: {
        patterns: [
            {
                priority: 20,
                intent: "buff",
                condition: { turn: { equals: 1 } },
                action: { selector: { tags: ["power"] }, mode: "random" },
                describe: "第1回合：强化"
            },
            {
                priority: 15,
                intent: "special",
                condition: { turn: { mod: [3, 0] } },
                action: { selector: { tags: ["skill"] }, mode: "random" },
                describe: "每3回合：技能"
            },
            {
                priority: 10,
                intent: "defend",
                condition: { selfHealth: { below: 40 } },
                action: { selector: { tags: ["defend"] }, mode: "random" },
                describe: "血量<40%：防御"
            }
        ],
        fallback: {
            intent: "attack",
            action: { selector: { tags: ["attack"] }, mode: "random" }
        }
    }
}
```

---

## 相关文件

行为决策：`src/core/objects/system/EnemyBehavior.ts`
回合执行：`src/core/objects/game/enemyTurn.ts`
敌人类：`src/core/objects/target/Enemy.ts`（buildHand、getAvailableCards）
意图系统：`src/core/objects/system/Intent.ts`
敌人列表：`src/static/list/target/enemyList.ts`
