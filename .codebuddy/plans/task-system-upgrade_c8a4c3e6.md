---
name: task-system-upgrade
overview: 升级任务系统为"每日任务"和"月度打卡"双维度体系，包括数据结构重构、智能重置逻辑、UI组件开发和成就奖励系统
todos:
  - id: extend-task-interface
    content: 扩展 Task 接口，新增 type 和月度任务相关字段定义
    status: completed
  - id: add-monthly-actions
    content: 新增 toggleMonthlyTask、checkMonthlyReset 等 Store Actions
    status: completed
    dependencies:
      - extend-task-interface
  - id: update-reset-logic
    content: 修改 checkDailyReset，增加月度任务数据迁移和重置逻辑
    status: completed
    dependencies:
      - add-monthly-actions
  - id: add-default-values
    content: 为新字段设置默认值，确保现有数据兼容
    status: completed
    dependencies:
      - extend-task-interface
---

## 产品概述

将《磁贴大作战》从简单的习惯清单升级为具有时间维度和成就体系的任务管理工具，新增两种任务类型：

- **每日任务**：周期为 24 小时，每天重置，重在即时磁贴奖励
- **月度打卡**：以自然月为周期，记录累计完成次数，重在"坚持奖励"和"进度视觉反馈"

## 核心功能

1. **任务类型区分**：支持每日任务和月度打卡两种类型
2. **月度进度追踪**：记录月度任务的累计打卡天数、打卡历史日期
3. **目标达成奖励**：月度任务达成目标天数后发放额外磁贴大奖
4. **自动重置机制**：每日任务每日重置，月度任务自然月结算

## 技术栈

- 框架：Taro + React + TypeScript
- 状态管理：Zustand + persist 中间件
- 样式：Tailwind CSS
- 日期处理：dayjs

## 实施方案

### 数据结构调整（Store 层）

扩展现有 Task 接口，新增类型区分和月度任务特有字段：

```typescript
interface Task {
  id: string;
  type: 'daily' | 'monthly'; // 任务类型
  title: string;
  icon: string;
  magnetReward: number; // 单次奖励
  
  // 每日任务字段
  completed: boolean;
  lastCompletedDate: string;
  dailyLimit?: number;
  completedCount?: number;
  
  // 月度任务特有
  monthlyProgress: number; // 本月已打卡天数
  targetDays: number; // 目标天数（如 20 天）
  bonusReward: number; // 达成目标额外奖励
  history: string[]; // 打卡日期记录
}
```

### 新增 Store Actions

- `toggleMonthlyTask(taskId)`: 月度任务打卡
- `checkMonthlyReset()`: 月度任务进度结算与重置
- `claimMonthlyBonus(taskId)`: 领取月度目标达成奖励

### 数据迁移策略

为保持兼容性，现有任务默认为 `type: 'daily'`，月度任务新字段设置默认值：

- `monthlyProgress: 0`
- `targetDays: 20`
- `bonusReward: 10`
- `history: []`

## 目录结构

```
src/store/useStore.ts  # [MODIFY] 扩展 Task 接口，新增月度任务相关 Actions
src/types/task.ts      # [NEW] 抽离 Task 类型定义，便于复用
```

## 实现注意事项

1. **数据兼容**：现有用户数据无 `type` 字段，需在 `checkDailyReset` 中自动补全默认值
2. **日期边界**：月度重置需判断跨月情况，使用 `dayjs().date() === 1` 或存储上月月份对比
3. **历史去重**：月度任务 `history` 数组需检查日期是否已存在，避免重复打卡