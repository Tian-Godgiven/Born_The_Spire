# 归档文件清单

本目录包含动态房间选择系统的所有相关文件。

## 文件结构

```
dynamic_room_selection/
├── README.md                          # 系统说明文档
├── FILE_LIST.md                       # 本文件
├── RoomGenerationRules.ts             # 旧版房间生成规则（基于权重）
├── RoomSelectRoom.ts                  # 房间选择房间类
├── RoomSelectRoom.vue                 # 房间选择 UI 组件
└── roomSelection/                     # 新版选择系统
    ├── types.ts                       # 类型定义
    ├── RoomSelector.ts                # 房间选择器（核心协调器）
    ├── RoomPoolManager.ts             # 房间池管理器
    ├── SelectionRuleFactory.ts        # 规则工厂
    ├── FloorSelectionState.ts         # 楼层选择状态
    └── rules/                         # 具体规则实现
        ├── DeduplicationRule.ts       # 去重规则
        ├── IncrementalProbabilityRule.ts  # 递增概率规则
        ├── PoolFrequencyRule.ts       # 池频率规则
        └── LayoutSelectionRule.ts     # 布局选择规则
```

## 原始位置

这些文件在主项目中的原始位置：

**核心逻辑：**
- `src/core/objects/system/RoomGenerationRules.ts`
- `src/core/objects/system/roomSelection/` （整个目录）

**房间类型：**
- `src/core/objects/room/RoomSelectRoom.ts`

**UI 组件：**
- `src/ui/page/Scene/running/RoomSelectRoom.vue`

## 未归档的相关文件

以下文件与房间选择系统相关，但因为会被新系统复用，所以保留在原位置：

**保留文件：**
- `src/core/objects/system/FloorManager.ts` - 楼层管理器（会被重构用于新系统）
- `src/core/objects/room/Room.ts` - 房间基类
- `src/core/types/FloorConfig.ts` - 层级配置类型（会被修改）
- `src/static/list/floor/floorList.ts` - 层级配置数据（会被修改）
- `src/static/registry/roomRegistry.ts` - 房间注册表

## 依赖关系

本系统依赖以下主项目组件：

**必需依赖：**
- Room 基类和房间类型系统
- FloorConfig 配置系统
- roomRegistry 房间注册表
- Choice 和 ChoiceGroup 选择系统
- GameRun 游戏运行管理器

**可选依赖：**
- Player 玩家类（用于条件检查）
- 日志系统（newLog）

## 使用说明

如果要在其他项目中使用本系统：

1. 复制本目录的所有文件
2. 确保目标项目有上述必需依赖
3. 调整导入路径（@/ 别名）
4. 根据需要修改配置格式
5. 实现或替换 UI 组件

## 注意事项

- 本系统已归档，不再维护
- 代码可能与主项目最新版本不兼容
- 建议作为参考实现，而不是直接使用
- 如需使用，请先测试并根据需要调整

## 归档信息

- 归档日期：2026-02-04
- 归档版本：commit 77cb307
- 归档原因：改用预生成地图系统
- 未来用途：用于其他项目（如无尽地牢战斗游戏）
