# 旧房间选择系统文件清单

本文档列出属于旧房间选择系统的文件和代码，这些代码保留用于兼容性。

## 核心文件（已标记 deprecated）

### 1. FloorManager.ts 中的旧方法

**文件：** `src/core/objects/system/FloorManager.ts`

**已废弃的方法：**
- `generateNextFloorRoomOptions()` - 动态生成房间选项
- `calculateRoomWeights()` - 计算房间权重
- `selectRoomsByType()` - 按类型选择房间
- `selectRandomRoomByType()` - 随机选择房间
- `getAvailableRooms()` - 获取可用房间列表
- `applyExhaustionStrategy()` - 应用池耗尽策略
- `selectRoomsFromLayout()` - 从布局选择房间
- `selectRandomFromCandidates()` - 从候选列表随机选择
- `selectWeightedFromCandidates()` - 按权重选择
- `getRoomPoolByType()` - 获取房间池

**状态：** 保留，标记为 `@deprecated`

**用途：** 兼容旧系统，不推荐在新代码中使用

### 2. RoomSelectRoom.ts

**文件：** `src/core/objects/room/RoomSelectRoom.ts`

**状态：** 保留，添加 `@deprecated` 说明

**用途：**
- 兼容旧系统（`useMapNodes: false`）
- 特殊事件中的房间选择

**推荐替代：** 使用地图UI（MapView.vue）

### 3. RoomGenerationRules.ts

**文件：** `src/core/objects/system/RoomGenerationRules.ts`

**内容：**
- `RoomGenerationRule` - 房间生成规则接口
- `RoomWeightConfig` - 房间权重配置
- `defaultRoomWeights` - 默认权重
- `getAllRoomGenerationRules()` - 获取所有规则

**状态：** 保留，用于旧系统

**推荐替代：** 使用 FloorMapConfig 的约束系统

## 配置类型（部分废弃）

### FloorConfig.ts 中的旧配置

**文件：** `src/core/types/FloorConfig.ts`

**已废弃的配置项：**
- `roomLayout` - 房间布局槽位配置
  - **替代：** `FloorMapConfig.layerLayouts`
- `roomGenerationRules` - 房间生成规则
  - **替代：** `FloorMapConfig.constraints`
- `selectionRules` - 选择规则配置
  - **替代：** `FloorMapConfig.constraints`
- `exhaustionStrategies` - 池耗尽策略
  - **替代：** `FloorMapConfig.roomAssignmentStrategy.exhaustionStrategy`

**状态：** 保留用于兼容，但不推荐使用

## 房间选择系统相关文件

### 1. roomSelection 目录

**路径：** `src/core/objects/system/roomSelection/`

**内容：**
- `types.ts` - 选择规则类型定义
- 其他选择规则相关文件

**状态：** 保留，用于旧系统

**推荐替代：** 使用地图系统

### 2. 旧的房间注册方式

**文件：** `src/static/registry/rooms/initEventRooms.ts` 等

**内容：** 使用 `roomLayout` 和 `selectionRules` 的房间注册

**状态：** 可以继续使用，但推荐迁移到新配置

## 已归档的文件

### archived_systems/dynamic_room_selection/

**路径：** `archived_systems/dynamic_room_selection/`

**内容：** 完整的旧动态房间选择系统文档和代码

**状态：** 归档，仅供参考

**用途：**
- 了解旧系统的设计
- 为其他项目提供参考
- 历史记录

## 新系统文件

以下是新地图系统的核心文件，**推荐使用**：

### 核心数据结构
- `src/core/objects/system/map/MapNode.ts` - 地图节点
- `src/core/objects/system/map/FloorMap.ts` - 地图管理
- `src/core/objects/system/map/MapGenerator.ts` - 地图生成器

### 配置类型
- `src/core/types/FloorMapConfig.ts` - 地图配置
- `src/core/utils/SeededRandom.ts` - 种子随机数

### UI组件
- `src/ui/page/Scene/running/MapView.vue` - 地图UI
- `src/ui/page/Scene/running/MapOverlay.vue` - 地图覆盖层

### 新房间类型
- `src/core/objects/room/FloorSelectRoom.ts` - 楼层选择

### Hook函数
- `src/core/hooks/step.ts` - 房间流程控制（已更新）

## 迁移建议

### 立即迁移
以下代码应该立即迁移到新系统：
- [ ] 使用 `generateNextFloorRoomOptions()` 的代码
- [ ] 直接创建 `RoomSelectRoom` 的代码（除非是特殊事件）
- [ ] 使用 `roomLayout` 配置的楼层

### 可以延后迁移
以下代码可以继续使用，但建议逐步迁移：
- [ ] 使用 `roomGenerationRules` 的楼层配置
- [ ] 使用 `selectionRules` 的楼层配置
- [ ] 使用 `exhaustionStrategies` 的楼层配置

### 无需迁移
以下代码可以继续使用：
- ✅ 特殊事件中的 `RoomSelectRoom`（设置 `useMapNodes: false`）
- ✅ 房间池配置（`roomPools`）
- ✅ 房间注册（`roomRegistry`）

## 兼容性保证

### 保证兼容的版本
- 当前版本：v2.0（地图系统）
- 兼容版本：v1.0（动态选择系统）

### 何时移除旧代码
旧系统代码将在以下条件满足后移除：
1. 所有内置楼层已迁移到新系统
2. 所有Mod已迁移或提供迁移工具
3. 至少保留2个大版本的兼容期

**预计移除时间：** v4.0 或更晚

## 检查清单

使用以下清单检查代码是否使用了旧系统：

### 代码检查
- [ ] 搜索 `generateNextFloorRoomOptions` 的使用
- [ ] 搜索 `new RoomSelectRoom` 的使用（排除特殊事件）
- [ ] 搜索 `roomLayout` 配置
- [ ] 搜索 `roomGenerationRules` 配置
- [ ] 搜索 `selectionRules` 配置

### 配置检查
- [ ] 检查 `FloorConfig` 是否使用旧配置项
- [ ] 检查是否调用了 `generateMap()`
- [ ] 检查是否注册了 `setShowMapCallback()`

### 测试检查
- [ ] 测试地图生成是否正常
- [ ] 测试房间进入是否正常
- [ ] 测试地图UI是否显示
- [ ] 测试节点点击是否正常

## 相关文档

- `MIGRATION_GUIDE.md` - 迁移指南
- `FloorMapConfig.usage.md` - 地图配置使用指南
- `MapView.integration.md` - 地图UI集成指南
- `archived_systems/dynamic_room_selection/README.md` - 旧系统文档

## 技术支持

如有问题，请查看：
1. 迁移指南（MIGRATION_GUIDE.md）
2. 控制台日志（查找 deprecated 警告）
3. 相关文档和示例代码
