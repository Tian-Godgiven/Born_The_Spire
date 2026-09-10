# 敌人AI系统

敌人的行为通过声明式的 `behavior` 配置驱动，无需编写回调函数。每回合开始时系统根据条件自动选牌，构建手牌并展示意图给玩家。

---

## behavior 结构

```typescript
behavior: {
    moves?: {                      // 杀戮尖塔式剧本：每回合选一招，一招可打出多张牌
        mode?: "loop" | "sequence" | "weighted",
        list: EnemyMove[]
    },
    patterns?: BehaviorPattern[],  // 插队：比剧本优先，命中则本回合不走 moves、也不推进循环指针
    fallback?: BehaviorPattern,    // 剧本与 pattern 都未选出牌时的默认行为
    handSize?: number              // 每回合手牌数量，默认 5
}
```

有 `moves` 时，每回合只决定一招，牌张数由这一招的 `cards` 决定，不要再配 `actions-per-turn`。
没有 `moves` 时，仍按 `priority` 遍历 `patterns`，全部不满足则 `fallback`；`actions-per-turn` 会把这套流程评 n 次（每次一张）。

---

## pattern 格式

```typescript
{
    priority?: number,             // 优先级，数字越大越先检查，默认 0
    intent?: IntentType | IntentType[], // 一张牌用字符串；多张可写数组，不填则每张按效果推导

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

不填 intent 时，系统从所选卡牌的 use 效果推导（`gainArmor` → 防御，`attack`/`damage` → 攻击，`applyState` 打对面 → 减益）。
多张行动牌会生成多段意图并排显示（充能+打击会同时看到增益图标和攻击数值）。
声明单个 intent 字符串时，该类型套在这一招的每一张上；要混搭就写数组，或干脆不填让每张自己推导。
不要用 `unknown` 表示「技能池里牌不一样」——那会一律显示问号。`unknown` 只留给真正要藏意图的迷雾行动。

---

## moves 剧本（推荐用来写有规律的行动）

每回合选「一招」，一招 = 本回合要打出的牌，张数可以每回合不同。循环指针存在敌人实例上，不会改到共享的 behavior 配置。

```typescript
moves: {
    mode: "loop",                  // loop 循环 / sequence 打完停住 / weighted 按权重抽招
    list: [
        {
            cards: [
                "enemy_card_unstable_charge",
                ["original_card_00001", "original_card_00014"]  // 这一格从数组里随机一张
            ],
            describe: "充能，并随机打击或防御"
        },
        {
            condition: { hasState: { target: "self", stateKey: "charge", stacks: 2 } },
            cards: ["enemy_card_discharge"],
            describe: "充能≥2：放电"
        }
    ]
}
```

`cards` 每一格：
    字符串 — 打出这张 key
    字符串数组 — 从这些 key 里随机一张（打击或防御）
    某一格的卡不在可用牌里（器官坏了）→ 整招作废，继续看下一招

循环内部可以加 `condition`，字段和 pattern 完全一样。
    `mode: "loop"`：从当前指针起绕一圈，条件不满足的招跳过，打出第一招能打的，指针停在它后面
    `mode: "sequence"`：同样跳过不满足的，但不绕回开头；指针走到末尾后本回合不再出招
    `mode: "weighted"`：在本回合所有条件满足的招里按 `weight`（默认 1）抽一招，不推进指针

现行例子：装甲哨卫 `enemy_armored_sentry`。充能回合打「不稳定充能 + 打击或防御」，充能满了才打放电（单张）。

`patterns` 仍可插队（例如护甲≥40 改打爆发）。插队成功时本回合不走剧本，也不推进循环指针。不要写没有 condition 的 pattern，否则会永远挡住剧本。

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
    stacks?: number,  // 最少层数；不填且无 below 时默认 >0
    below?: number    // 层数严格小于
}
```

示例：

```typescript
condition: { hasState: { target: "self", stateKey: "power", stacks: 3 } }
// 自身力量层数 >= 3

condition: { hasState: { target: "self", stateKey: "charge", below: 2 } }
// 自身充能层数 < 2
```

### 器官条件

```typescript
condition: { hasOrgan: "enemy_organ_unstable_battery" }
```

自身仍持有该器官时才走这条 pattern。指定了 `selector.key` 却没抽到对应卡时，不会用基础打击顶上。

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
"loop"      — 按 sequence 顺序循环，每次行动取下一张（指针在敌人 `aiCursor` 上）
"sequence"  — 执行完一轮后停在末尾不再循环

一招要打出多张牌，用上面的 `moves`，不要用这里的单卡 loop。
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

没有 `moves` 时，用 status 字段设置「每回合独立抽几次」：

```typescript
status: {
    "max-health": 80,
    "actions-per-turn": 2   // 每回合行动2次，默认1次
}
```

每次行动独立走一遍 pattern 选择流程，各自选出一张牌。同一套 `hasState` 条件会被看到两次——充能满了会连放两发放电。一招要打出多张、或放电只打一张，用 `moves`，不要用 `actions-per-turn`。

意图按本回合所有行动牌分段展示，不再只显示第一张。

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

## 意图数值计算

意图显示的数值（伤害/格挡等）由 `intentValueSources` 映射决定 —— 每种意图类型从哪些 effect key 的 `params.value` 累加取值。

内置映射（`src/core/objects/system/Intent.ts`）：

```typescript
const intentValueSources: Partial<Record<IntentType, string[]>> = {
    attack: ["attack", "damage"],
    defend: ["gainArmor"],
    heal: ["heal"]
}
```

`buff` / `debuff` / `special` / `escape` / `unknown` 未列入 → 不显示数值，只显示类型标签。

Mod 通过 `registerIntentValueSource(intentType, effectKeys)` 扩展或覆盖。

### Buff 影响与护甲不扣减

数值不是直接读 `params.value`，而是走 `previewEffect` 折叠 `before` / `on` 上的改参效果：

  source 端 Buff（力量、虚弱等）→ 影响输出
  target 端 Buff（易伤、飞飘/飞行减半等）→ 影响接收
  护甲吸收、飞飘/飞行扣层、过期隔板掷骰 → **不进预览**
  `attack` 是挨打，`damage` 是中毒等非挨打；意图的攻击类会读这两种效果 key，但折叠按各自的 before / on 触发器算
  `multiplier` → 乘进单段数值（放电 `value: 3, multiplier: "$source.stateStack(charge)"`，2 层充能显示 6，不是 3）
  `repeatEffects` → 展开成段数，同值多段显示 `n × m`（群咬 3 点打 2 次显示 `3 × 2`）
  模拟时 medium 必须是卡牌本身，`$owner.status(hits)` 才能解析
  多张行动牌各自算一段 `parts`，不再把两张牌的伤害加进同一个数字

技术实现：`previewEffect` 只跑挂了 `preview` 的改参，护甲吸收没有 `preview`，不会扣格挡。

技术实现：`event.simulate = true`，护甲相关触发器在 `simulate` 模式下自动跳过。

自定义 EffectFunc（如 `card_commandStrike`）在数据里看不到 `damage` 单元，意图仍然读不到；能用 `damage` + `multiplier` / `repeatEffects` 表达的不要写成专属效果。

未指定 target 时，用 `intentDummyTarget`（无触发器的空实体）替代，避免触发 target 端机制。

---

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

## 能量

敌人默认有能量，上限 3，和玩家一样回合开始回满、回合结束清空。打牌走 `payEnergy`，费用不够则打不出（日志会记）。

选意图发生在玩家回合开始时，那时敌人能量还是上回合清空后的 0，所以 AI **不按当前能量筛卡**。能不能付费看敌人自己回合开始回满（以及电池这类 after turnStart 加费）之后。故障机器上限 2、重击 3 费，要靠不稳定电池 +1 才能打出。

---

## 相关文件

行为决策：`src/core/objects/system/EnemyBehavior.ts`
回合执行：`src/core/objects/game/enemyTurn.ts`
敌人类：`src/core/objects/target/Enemy.ts`（buildHand、getAvailableCards）
意图系统：`src/core/objects/system/Intent.ts`
敌人列表：`src/static/list/target/enemyList.ts`
