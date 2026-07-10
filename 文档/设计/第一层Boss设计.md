# 第一层Boss设计

第一层共3种Boss，随机遭遇其中一个。每种Boss代表不同的威胁模型，要求玩家采用不同的应对策略。

器官设计原则（与精英相同）：
  玩家可以选喜欢的 — 对玩家有独立吸引力
  单独可用 — 不依赖同一Boss的其他器官
  强度高于精英器官（Boss级奖励）
  与同层器官和遗物有配合空间

每场Boss战斗，玩家击败后从Boss的全部器官中选取1个。

---

## Boss 1：炙渣王（待实现）

key: enemy_slag_king
血量：220
战斗配置：battle_f1_boss_slag_king
主题：垃圾堆深处的废熔渣意志聚合体，被重击时反而自我锻造得更强

核心机制：点火自锻
  炙渣王身上带有 ignition 状态层数（点火），从 0 累计到 4
  每当炙渣王打出一张攻击牌，ignition +1
    实现：点火核器官的 after via useCard 触发器 + `condition: "$triggerCard.hasTag(attack)"`
  ignition 累计到 4 时使用 重铸：获得 4 层力量并将 ignition 清零
    行为模式中一条 priority 高的规则 —— 当 hasState ignition >= 4 时使用 重铸
    重铸 卡牌自身效果里 removeState ignition
  第 1 回合固定使用 铸铁力（自 buff 开局）

压力模型：自我锻造型爆发。压力不来自"定时炸弹"，而是"你越拖，它越强"——攻击叠层不断放大，前期造成显著伤害才能压节奏，否则后期每次挨打都是数十点。战术选择：速攻打断锻造节奏，或备好高防御硬扛后期。

行为模式
  priority 100 | turn 1：铸铁力（+1 力量开局）
  priority 50  | hasState ignition >= 4：重铸（+4 力量 + 清零 ignition）
  fallback：从"铁刺 / 熔铸打击 / 高炉护壁"中随机选一张

---

### 器官（4 个，玩家击败后可选 1 个）

点火核（enemy_organ_ignition_core，Rare）
  提供卡牌：重铸
  被动：持有者每打出一张攻击牌，自身获得 1 层 ignition
  设计定位：自锻循环的引擎。玩家选取后能自己积累 ignition 触发 重铸（+4 力量）
  独立性：完全独立。任何攻击流玩家都能自然触发它

熔铸魂（enemy_organ_cast_soul，Uncommon）
  提供卡牌：铸铁力
  被动：战斗开始时获得 2 层力量
  设计定位：开局稳态强度。任何构筑都能吃到开局 +2 力量
  独立性：完全独立

铁角腺（enemy_organ_iron_horn_gland，Uncommon）
  提供卡牌：铁刺
  被动：多段攻击（tag 含 "multiHit"）的每一段额外造成 1 点伤害
  设计定位：多段攻击流的核心器官
  独立性：只要玩家有任何多段攻击就有价值；孤立时至少能加强自身提供的 铁刺

熔渣心（enemy_organ_slag_heart，Common）
  提供卡牌：熔铸打击、高炉护壁
  被动：持有者获得力量时额外多获得 1 层（拦截 applyState power，stacks +1）
  设计定位：力量放大器。与 熔铸魂、铸铁力、重铸 都有 combo
  独立性：只要有任何加力量的来源就生效

---

### 配套卡牌（5 张）

铸铁力（boss1_card_iron_might）| 来源：熔铸魂
  1 费，能力牌
  获得 1 层力量
  Tag：power

重铸（boss1_card_recasting）| 来源：点火核
  0 费，技能牌
  获得 4 层力量
  移除自身 ignition 状态
  Tag：skill
  角色：Boss 在 ignition ≥ 4 时打出（清零并大额 +力量）

铁刺（boss1_card_iron_spike）| 来源：铁角腺
  1 费，攻击牌
  造成 4 点伤害两次（多段攻击）
  Tag：attack、multiHit

熔铸打击（boss1_card_cast_strike）| 来源：熔渣心
  1 费，攻击牌
  造成 8 点伤害
  Tag：attack

高炉护壁（boss1_card_furnace_wall）| 来源：熔渣心
  1 费，技能牌
  获得 8 点护甲
  Tag：defence

---

### 需要的新内容

新状态：点火（ignition）— 通用计数器，其他"阈值爆发"型敌人也可复用
新 EffectFunc：
  organ_multiHitBonus — 铁角腺：拦截多段攻击卡的 damage Effect，params.value + bonus
  organ_powerAmplify — 熔渣心：拦截 applyState power，stacks + bonus（对称 organ_poisonAmplify）
其他：全部用现有原子效果和声明式 trigger/reaction 拼装

---

### 系统压力测试点位（本 Boss 用于验证）

  ignition 状态（通用计数器状态定义）
  hasState 行为条件（EnemyBehavior 中启用）
  turn 行为条件
  after via useCard + `condition: "$triggerCard.hasTag(attack)"` 过滤
  applyState power 拦截（Effect targetType=triggerEffect）
  damage 拦截 + 卡牌 tag 过滤（multiHit）
  removeState 在卡牌效果里作为主动清零
  多来源力量叠加（战斗开始+2 + 铸铁力+1 + 重铸+4 + 熔渣心放大器 +1/次）

---

## Boss 2：疫孢菌母（已实现）

key: enemy_plague_mother
血量：180
战斗配置：battle_f1_boss_plague_mother
主题：垃圾堆中有机物腐化的源点，第一层所有毒素的来源

核心机制：孢子蔓延（塞牌+中毒DoT）
  每3回合（第1、4、7...）向玩家抽牌堆塞入3张孢子牌
  孢子牌在玩家手牌中时，回合结束施加1层中毒（随后消耗）
  平时用感染打击（8伤+2层中毒）施加稳定压力
  HP降至50%以下时，每回合行动次数增至2（内置触发器，非器官）

压力模型：手牌污染+中毒滚雪球。孢子牌挤占手牌，中毒随时间积累，拖延越久压力越大。

行为模式
  每3回合（第1、4、7...）：孢子爆发（向玩家抽牌堆塞3张孢子牌）
  常规：感染打击（8伤+2层中毒）

### 器官（均已实现，玩家击败后可选1个）

孢子腺（enemy_organ_spore_gland，Rare）
  提供孢子爆发卡牌
  对玩家：每回合往对手牌堆塞3张孢子牌

寄生菌根（enemy_organ_parasitic_root，Uncommon）
  对手每累计受到8点伤害，持有者回复2点生命
  实现：accumulateAndTrigger，triggerTarget: "allOpponents"

腐化铠甲（enemy_organ_corruption_armor，Uncommon）
  回合结束时，每有1个对手具备debuff获得3点护甲

剧毒心核（enemy_organ_toxic_core_boss，Rare）
  施加中毒时额外+1层
  实现：before make applyState 拦截 + organ_poisonAmplify

菌网根系（enemy_organ_mycelial_network，Common）
  回合开始时，给随机1个对手施加2层中毒
  实现：organ_mycelialSpread 专属效果

### 配套卡牌（均已实现）

感染打击（boss2_card_infection_strike）
  1费，攻击牌：造成8点伤害，施加2层中毒

孢子爆发（boss2_card_spore_burst）
  1费，技能牌：向对手牌堆塞入3张孢子牌
  来源：孢子腺器官

孢子（boss2_card_spore）
  4费虚无牌（实际不可打出）：在手牌中时，回合结束施加1层中毒
  实现：inHand + before take turnEnd 触发

---

## Boss 3：废铁战甲（已实现）

key: enemy_iron_war_machine
血量：180
战斗配置：battle_f1_boss_iron_war_machine
主题：由废料拼凑的巨型机甲，第一层机械种族的顶点

核心机制：护甲堆叠 → 钢铁压碾爆发
  常规循环里稳定输出 + 上易伤 + 力场护盾（吸攻击卡）
  护甲累积到阈值时打出无视护甲的重击，随后自身护甲清零重新积累
  力场护盾对攻击卡免疫 1 次，玩家攻击流会被反复削弱节奏

压力模型：多向压力（护甲铁墙 + 稳定伤害 + 攻击免疫 + 阈值爆发）。护甲堆叠让常规输出效率低下；力场护盾专克攻击卡流；钢铁压碾对护甲流也不失效。

行为模式
  priority 50 | 自身护甲 ≥ 40：钢铁压碾（25 无视护甲伤害 + 自身护甲清零）
  fallback（loop）：装甲组装 → 火力压制 → 装甲组装 → 火力压制 → 过载屏障

### 器官（4 个，玩家击败后可选 1 个）

铁壁核心（enemy_organ_iron_wall_core，Uncommon）
  提供卡牌：装甲组装
  被动：战斗开始时获得 15 点护甲
  设计定位：开局稳态护甲。任何构筑都能吃到开局甲
  独立性：完全独立

过载核心（enemy_organ_overload_core，Rare）
  提供卡牌：过载屏障
  被动：战斗开始时获得 1 层力场护盾
  设计定位：先手免疫一次攻击。对高伤单击卡组价值极高
  独立性：完全独立

液压双管（enemy_organ_hydraulic_dual_gun，Uncommon）
  提供卡牌：火力压制
  被动：每回合首次攻击伤害 +3
  设计定位：稳定小额加伤。任何攻击流吃满
  独立性：完全独立
  实现：hydraulicUsed 状态作为器官内部标记（$item.hasState），turnEnd 清除

钢铁意志（enemy_organ_steel_will，Rare）
  提供卡牌：钢铁压碾
  被动：每场战斗第一次致命伤害免疫（残 1 HP）
  设计定位：保命卡。任何构筑通用
  独立性：完全独立
  实现：lethalGuardReady 状态战斗开始附加；before take damage trigger（level -100，护甲吸收之后）+ checkAndSaveLethal 效果检测致命并保命

### 配套卡牌（4 张）

装甲组装（boss3_card_armor_assembly）| 来源：铁壁核心
  1 费，技能牌
  自身获得 15 点护甲；对手施加 1 层易伤
  Tag：skill、enemy

过载屏障（boss3_card_overload_barrier）| 来源：过载核心
  1 费，技能牌
  自身获得 2 层力场护盾
  Tag：skill、enemy

火力压制（boss3_card_firepower_suppression）| 来源：液压双管
  1 费，攻击牌
  造成 8 点伤害 2 次（两个独立 damage 事件）
  Tag：attack、multiHit、enemy

钢铁压碾（boss3_card_steel_roll）| 来源：钢铁意志
  2 费，技能牌
  造成 25 点无视护甲伤害；自身护甲清零
  Tag：skill、enemy

### 新增基础设施（Boss 3 引入，通用可复用）

新状态：
  forceFieldShield（力场护盾）— 每层免疫 1 次攻击卡伤害，被打消耗层数，不自动衰减
    实现：before take damage trigger + `condition: "$triggerCard.hasTag(attack)"` + nullifyDamageValue + changeStateStack -1
  hydraulicUsed（液压已释放）— 器官内部标记；turnEnd 自动清零
  lethalGuardReady（钢铁意志充能）— 器官内部标记；refresh 型 bool 状态

新 EffectFunc：
  damageIgnoreArmor — 通过 `event.info.ignoreArmor` 标记转发 damageTo 事件；护甲吸收 trigger 会检测该 flag 并跳过
  checkAndSaveLethal — 检测目标伤害是否致命；是则将 params.value 置 0 并消耗 lethalGuardReady

新 mechanism 分支：
  armor absorb trigger 检查 `event.info.ignoreArmor`，为 true 时不吸收

### 系统压力测试点位（本 Boss 用于验证）

  $item.hasState DSL（器官持有内部状态）
  ConditionGroup 组合（and / not 嵌套）
  target: "item" 效果级目标覆盖（器官对自身施加状态）
  StateModifier 应用于非 Target Entity（Organ）
  多段攻击的双独立事件语义（vs 单事件多段）
  event.info flag 拦截机制（damage → ignoreArmor）
  low-level trigger（level -100）用于"护甲吸收之后再处理"的顺序控制

---

## Boss 遗物设计

Boss 击败后额外给予的强力遗物（`pool: ["boss"]`、`rarity: "rare"`），区别于器官奖励。第一层规划 5 个，玩家从中选 1 个作为 Boss 战奖励。设计原则：每个都是"强收益 + 明显代价 / 规则改变"，避免同质化。

### 已实现 5 个

炽热之心（original_relic_flaming_heart）
    描述：能量上限 +1；战斗结束时失去 3 点生命
    机制：possess 时 addStatusBase max-energy +1；battleEnd 触发 loseHealth 3
    设计定位：能量+代价，稳定持续消耗，前中期强、后期需回血支撑

能量沉淀（original_relic_energy_sediment）
    描述：回合结束时未使用的能量在下回合开始时返还
    机制：status.storedEnergy；turnEnd 存能、turnStart 释放并清零
    设计定位：纯收益，鼓励能量节奏优化（能量牌/打小怪保能量）

先知之瞳（original_relic_prophet_eye）
    描述：获得时能量上限 +2；第 1 回合抽牌 +5；第 3 回合起每回合抽牌 -1
    机制：possess 加 max-energy +2 + addTurnDraw{turn:1, value:5}；turnStartDrawCard 触发条件 $battle.turn >= 3 时 modifyDrawValue -1
    设计定位：前爆发后衰减，鼓励打 combo / 速攻构筑

空茧（original_relic_empty_cocoon）
    描述：获得时从牌组中永久移除 2 张牌；最大生命 -10%
    机制：possess.effects 挂 addMaxHealthAndHeal{percent:-0.1} + chooseCardRemove{count:2, minCount:2}
    设计定位：一次性交易，用生命换牌组精简；策略 = 挑基础打击/防御删掉换构筑纯度

有生命活铁（original_relic_living_iron）
    描述：每 3 回合，回合开始时获得 10 点护甲（跨战斗累计）
    机制：status.point/maxPoint=3；accumulateAndTrigger on=turnStart, gain=1, threshold=3, consume=3, effects=gainArmor{value:10}；不设 maxTriggerPerBattle → point 天然跨战斗保留
    UI：badges counter 显示 "point/maxPoint" 进度圈
    设计定位：跨战斗节奏防御。玩家可有意识地控制回合数对齐"3 的倍数"，让"欠的那份"延续到下场兑现；纯收益无代价，靠"节奏运营"的策略深度立起 Boss 遗物档位
    参考同构：第六指（每抽 6 张再抽 1 张）——把事件从 drawCard 换成 turnStart、效果从 draw 换成 gainArmor

### 技术备忘

percent 参数（负值即扣 max）由 `addMaxHealthAndHeal` 提供，实现于 `src/core/effects/modifier/addModifier.ts`
删牌能力由 `chooseCardRemove` 提供，弹选牌 UI + `minCount` 强制选完
上述遗物的 pool 均为 `["boss"]`，rarity 均为 `"rare"`

---

## 待讨论

Boss 1（炙渣王）的完整实现
各 Boss 的器官数值平衡
