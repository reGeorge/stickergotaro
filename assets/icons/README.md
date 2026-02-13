# TabBar 图标说明

此目录用于存放微信小程序的 tabBar 图标。

## 需要的图标文件

每个页面需要两个图标（普通状态和选中状态）：
- `home.png` / `home-active.png` - 首页
- `shop.png` / `shop-active.png` - 梦想屋
- `chart.png` / `chart-active.png` - 统计
- `camera.png` / `camera-active.png` - 美好
- `user.png` / `user-active.png` - 我的

## 图标规格

- 大小：建议 81px * 81px（小程序标准尺寸）
- 格式：PNG
- 背景：透明

## 添加图标后

1. 取消 `src/app.config.ts` 中 `iconPath` 和 `selectedIconPath` 的注释
2. 重新运行 `npm run build:weapp`

## 获取图标

可以使用以下方式获取图标：
1. 在线图标库：Iconfont、IconPark 等
2. 设计工具：Figma、Sketch 等
3. AI 生成工具

目前图标已被暂时注释，项目可以先正常运行。
