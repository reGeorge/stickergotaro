---
name: fix-taro-weapp-project
overview: 修复 Taro 微信小程序项目的完整性问题，使其能够在微信开发者工具中正常运行和调试
todos:
  - id: install-dependencies
    content: 执行 npm install 安装项目依赖包
    status: completed
  - id: fix-tsconfig
    content: 修正 tsconfig.json 配置，移除 Angular 配置并修正入口文件路径
    status: completed
  - id: create-icons
    content: 创建 src/assets/icons/ 目录和 10 个 tabBar 图标文件
    status: completed
    dependencies:
      - install-dependencies
  - id: build-project
    content: 执行 npm run build:weapp 编译项目
    status: completed
    dependencies:
      - fix-tsconfig
      - create-icons
  - id: verify-dist
    content: 验证 dist 目录结构并确认项目可在微信开发者工具中打开
    status: completed
    dependencies:
      - build-project
---

## 产品概述

检查并修复使用 Taro 框架迁移的微信小程序项目，确保项目能够在微信开发者工具中正常调试和运行。

## 核心功能

- 安装项目依赖包
- 修正 TypeScript 配置文件
- 创建 tabBar 图标资源文件
- 编译项目生成小程序代码
- 验证项目在微信开发者工具中的可用性

## 技术栈

- 前端框架：Taro 3.6.0 + React 18
- 开发语言：TypeScript
- 样式方案：TailwindCSS + weapp-tailwindcss-webpack-plugin
- 状态管理：Zustand
- 图表库：echarts-taro3-react
- 日期处理：dayjs

## 实现方案

### 问题分析

当前项目存在以下关键问题，导致无法在微信开发者工具中运行：

1. **缺少 node_modules**：依赖包未安装，无法执行构建命令
2. **tsconfig.json 配置错误**：入口文件指向错误（./index.tsx），包含无关的 Angular 配置
3. **缺少图标资源**：src/assets/icons/ 目录不存在，缺少 10 个 tabBar 图标文件
4. **缺少 dist 目录**：项目未编译，无法在开发者工具中预览

### 解决策略

1. **安装依赖**：执行 `npm install` 安装所有必需的依赖包
2. **修正配置**：更新 tsconfig.json，移除 AngularCompilerOptions，将 files 字段改为指向 `src/app.tsx`
3. **创建图标资源**：创建 src/assets/icons/ 目录，使用简单的 64x64 PNG 占位图标（使用 Base64 编码的最小有效 PNG）
4. **编译项目**：执行 `npm run build:weapp` 生成 dist 目录
5. **验证输出**：确认 dist 目录结构符合 project.config.json 配置（miniprogramRoot: dist/）

### 关键技术决策

- **图标文件**：使用最小有效的 Base64 编码 PNG 文件作为占位符，确保项目可以编译运行。后续可替换为正式设计的图标。
- **配置修复**：仅修改必要的配置项，保留 Taro 的正确配置，避免引入新的兼容性问题。
- **构建流程**：遵循 Taro 标准构建流程，使用官方提供的构建命令。

### 性能与可靠性

- 使用 npm 安装依赖，确保依赖版本与 package.json 一致
- 图标文件使用轻量级占位符，不影响构建性能
- 配置修改最小化，降低引入错误的风险

## 实现细节

### 核心目录结构

```
stickergotaro/
├── src/
│   ├── assets/icons/       # [NEW] 创建图标资源目录
│   │   ├── home.png         # [NEW] 首页图标
│   │   ├── home-active.png  # [NEW] 首页激活图标
│   │   ├── shop.png         # [NEW] 梦想屋图标
│   │   ├── shop-active.png  # [NEW] 梦想屋激活图标
│   │   ├── chart.png        # [NEW] 统计图标
│   │   ├── chart-active.png # [NEW] 统计激活图标
│   │   ├── camera.png       # [NEW] 美好图标
│   │   ├── camera-active.png # [NEW] 美好激活图标
│   │   ├── user.png         # [NEW] 我的图标
│   │   └── user-active.png  # [NEW] 我的激活图标
│   ├── app.tsx              # Taro 应用入口
│   └── app.config.ts        # 应用配置（包含 tabBar 配置）
├── config/
│   └── index.js             # Taro 构建配置（包含 copy 配置）
├── tsconfig.json            # [MODIFY] 修正配置
├── project.config.json      # 微信开发者工具配置（miniprogramRoot: dist/）
├── package.json             # 项目依赖配置
└── dist/                    # [BUILD] 构建输出目录
```

### 配置文件修改

#### tsconfig.json 修改

- 删除 `angularCompilerOptions` 字段（Angular 特有配置）
- 修改 `files` 字段：`["./index.tsx"]` → `["./src/app.tsx"]`

### 图标文件实现

使用 Base64 编码的最小有效 PNG 文件，每个图标为 64x64 像素的简单占位图。实际部署时建议替换为正式设计的图标。