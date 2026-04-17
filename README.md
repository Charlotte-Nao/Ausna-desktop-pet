# Asuna 桌面宠物项目说明

## 项目概述
这是一个基于 Electron 和 Live2D 的桌面宠物应用，角色为 "亚丝娜"（Asuna）。项目包含前端界面、Live2D模型渲染、交互功能、系统托盘和窗口控制等功能。

## 文件结构说明
```
4.16/
├── src/                          # 源代码目录
│   ├── index.html               # 前端主界面
│   ├── main.js                  # Electron主进程
│   └── test_simple.html         # 测试页面
├── resources/                   # 资源文件
│   ├── css/
│   │   └── Live2D.css          # Live2D样式文件
│   ├── js/
│   │   ├── Live2D.js           # Live2D模型控制
│   │   ├── live2d.min.js       # Live2D核心库
│   │   ├── live2d-helper.min.js # Live2D辅助库
│   │   └── jquery.min.js       # jQuery库
│   ├── models/                  # Live2D模型文件
│   ├── images/                  # 图标资源
│   └── audio/                   # 音频文件
├── package.json                 # 项目配置和依赖
└── README.md                    # 本说明文件
```

## 核心文件功能详解

### 1. src/main.js (Electron主进程)
**文件作用**: 控制应用窗口、系统托盘、窗口拖拽和IPC通信。

**函数注解**:
- `createWindow()`: 创建主窗口。调整亚丝娜大小需修改 `width` 和 `height` 参数（需同步修改 index.html 中 canvas 尺寸）。调整窗口位置修改 `x` 和 `y` 参数。
- `setupTray()`: 设置系统托盘图标和右键菜单。
- `setupWindowDrag()`: 设置窗口拖拽功能，通过IPC监听拖拽事件。
- IPC事件监听:
  - `close-window`: 监听关闭窗口事件
  - `minimize-window`: 监听最小化窗口事件
  - `toggle-always-on-top`: 监听切换窗口置顶事件

### 2. src/index.html (前端界面)
**文件作用**: 前端主界面，包含Live2D画布、气泡消息、控制按钮和右键菜单。

**样式调整**:
- **亚丝娜大小**: 修改 `<canvas id="glcanvas" width="500" height="1000">` 中的 `width` 和 `height` 属性。
- **气泡样式**: 在 `<style>` 标签中的 `.speech-bubble` 类中调整：
  - `max-width`: 气泡最大宽度
  - `min-width`: 气泡最小宽度
  - `padding`: 内边距
  - `border-radius`: 圆角大小
  - `left`: 水平位置（50%为居中）
  - `top`: 垂直位置（距离顶部的距离）
  - `transform`: 变换效果

**JavaScript函数注解**:
- `initializeDesktopPet()`: 初始化桌面宠物，加载Live2D模型和高级功能。
- `setupEventListeners()`: 设置事件监听器，处理拖拽、右键菜单、控制按钮等。
- `showContextMenu(x, y)`: 显示右键菜单，参数为菜单显示坐标。
- `hideContextMenu()`: 隐藏右键菜单。
- `handleContextMenuAction(action)`: 处理右键菜单选项，根据action执行相应操作。
- `playFortune()`: 播放运势占卜音频。
- `changeCostume()`: 切换服装，循环切换01,02,03三个模型。
- `toggleControls()`: 切换控制按钮显示/隐藏。
- `showSpeechBubble(text, duration)`: 显示气泡消息。`text`为显示文本，`duration`为显示时长(毫秒)。
- `playRandomAudio(type)`: 播放随机音频，`type`为音频类型('interaction'或'fortune')。
- `interactWithAsuna(part)`: 与亚丝娜交互，`part`为身体部位('head','body','chest','foot')。
- `setupAsunaInteraction()`: 设置亚丝娜交互，点击画布不同部位触发不同反应。
- `initAdvancedFeatures()`: 初始化高级功能，延迟设置交互和显示欢迎气泡。

### 3. resources/js/Live2D.js (Live2D模型控制)
**文件作用**: 负责加载Live2D模型、实现鼠标跟随和提供工具函数。

**函数注解**:
- `initLive2D(modelName)`: 初始化Live2D模型，根据模型名称加载对应模型。
- `loadModel(modelName)`: 加载Live2D模型，创建Live2DHelper实例并加载模型文件。
- `followMouse()`: 鼠标跟随功能，实现模型视线跟随鼠标移动。
- `getRandomNum(min, max)`: 生成随机数，返回[min, max]范围内的随机整数。
- `getRandomArr(min, max)`: 生成随机数组，返回[min, max]范围内数字的随机排列。
- `shuffle(arr)`: 洗牌算法，随机打乱数组顺序。

### 4. resources/css/Live2D.css (样式文件)
**文件作用**: 控制Live2D画布位置和动画效果。

**样式说明**:
- `#glcanvas`: 画布样式，固定定位在右下角。如需调整亚丝娜位置，可修改 `bottom` 和 `right` 属性。
- `.animated`: 动画基础类，控制动画时长和效果。

## 如何调整参数

### 调整亚丝娜大小
1. **修改窗口尺寸**: 在 `src/main.js` 的 `createWindow()` 函数中修改 `width` 和 `height` 参数。
2. **修改画布尺寸**: 在 `src/index.html` 第175行修改 `<canvas>` 标签的 `width` 和 `height` 属性。
3. **保持比例**: 建议窗口和画布尺寸保持一致，避免拉伸变形。

### 调整气泡大小和位置
1. **修改CSS样式**: 在 `src/index.html` 的 `<style>` 标签中找到 `.speech-bubble` 类。
2. **调整大小**: 修改 `max-width`、`min-width`、`padding`、`border-radius` 等属性。
3. **调整位置**: 修改 `left`、`top` 和 `transform` 属性。当前设置为水平居中(`left: 50%`)、顶部20像素(`top: 20px`)。

### 调整窗口位置
1. **初始位置**: 在 `src/main.js` 的 `createWindow()` 函数中修改 `x` 和 `y` 参数。
2. **拖拽限制**: 当前支持自由拖拽，无边界限制。

### 调整鼠标跟随灵敏度
1. **修改跟随参数**: 在 `resources/js/Live2D.js` 的 `followMouse()` 函数中，可调整 `maxOffset` 计算方式。
2. **视线范围**: 修改 `normX` 和 `normY` 的计算公式可改变视线转动范围。

## 运行和构建

### 开发运行
```bash
npm start
```

### 开发模式（带开发者工具）
```bash
npm run dev
```

### 构建应用
```bash
npm run build
```

## 注意事项
1. 修改亚丝娜大小时，请同步修改窗口和画布尺寸，避免显示异常。
2. 气泡样式修改后，建议测试不同文本长度下的显示效果。
3. 音频文件放置在 `resources/audio/` 目录下，按类型分类存放。
4. Live2D模型文件放置在 `resources/models/` 目录下，命名格式为 `asuna_XX`（XX为01、02、03）。

## 故障排除
- **模型加载失败**: 检查模型文件路径和格式是否正确。
- **窗口透明失效**: 确保 `transparent: true` 和 `backgroundColor: '#00000000'` 设置正确。
- **鼠标跟随异常**: 检查画布尺寸和鼠标事件绑定。

---

*最后更新: 2026年4月17日*