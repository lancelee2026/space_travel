<!-- 
【文件作用与适用工具说明】
此文件是一份经过完整实战验证（Reverse-engineered）的“Vibe Coding 终极指南”。它不仅包含了项目的核心架构与业务需求，还融入了实际开发中踩坑后总结的工程约束与补丁方案。

适用工具：
- Cursor (Composer)
- Windsurf (Cascade)
- GitHub Copilot (Workspace)
- 任何支持读取多文件上下文与自主执行的 Agentic AI IDE 工具。

使用方法：
将此文件放在项目根目录或 docs 目录下，直接让 AI 读取此文件，并发送指令：“请完全按照 `深空引擎_cursor_plan.md` 的规范和步骤，为我从零开始编写整个项目。” AI 将根据这份详尽的约束和步骤，一步步精准还原具有同等完整度和专业体验的 WebGPU 互动科普项目。
-->

# 深空引擎 (e2n-cosmos) — Vibe Coding 实施指南

> 本文档基于实际开发落地的最终代码仓反向提取而成。它合并了技术选型、UI/UX 规范、移动端约束以及大量 WebGPU 性能优化的血泪经验。请在每次 Vibe Coding 对话中引用本文件作为**绝对参考系**。

---

## 一、 产品定位与愿景

`space.e2n.studio` 是一个跑在浏览器里的「深空科技馆」，产品定位于**儿童互动天文科普**，不追求科研级物理模拟，而是追求极致的视觉震撼与寓教于乐。

**核心功能矩阵**：
1. **自由探索**：单指拖拽视角，双指缩放，平滑的阻尼体验。
2. **知识热点 (Hotspots)**：点击 3D 场景中的浮动节点，底部弹出详情卡片。
3. **分步导览 (Guided Tour)**：一键进入电影级运镜导览，跟随视角自动切换知识卡片。
4. **小任务 (Quests)**：如“查看主恒星”、“飞近远处行星”，带有完成徽章与进度反馈。
5. **家长共读模式**：为儿童提供大白话解释，家长可点击展开更硬核的天文物理学细节（如洛希极限、史瓦西半径）。
6. **隐藏标签 (沉浸模式)**：一键隐藏所有 UI 热点，专心欣赏黑洞。

---

## 二、 核心技术栈与工程约束

### 1. 基础架构
- **核心库**：`three@^0.183.0`，全程使用 `three/webgpu` 和 `three/tsl`，**彻底抛弃旧版 WebGLRenderer**。
- **构建工具**：Vite (`vite@^5.4.14`)。
- **UI 层**：纯 HTML/CSS + 原生 JavaScript 类。**绝对禁止引入 React/Vue 等框架**，避免与 WebGPU 的 `requestAnimationFrame` 主循环产生渲染冲突或生命周期地狱。

### 2. 性能与兼容性硬约束 (血泪教训)
- **移动端发热控制**：移动端设备强制将 `devicePixelRatio` 锁定为 `1.0`（`isMobile ? 1 : Math.min(window.devicePixelRatio, 2)`）。体积光线追踪极为消耗 GPU，如果不锁 DPR，手机会在一分钟内发烫降频。
- **CubeCamera 性能节流**：引力透镜效果依赖隐藏的 `CubeCamera` 获取实时反射。**禁止每帧更新**！必须在 `update(deltaTime)` 循环中加入节流逻辑（例如每 3 帧更新一次），并将 `CubeRenderTarget` 分辨率保持在 `1024` 以兼顾质量与性能（降低到 512 会导致背景木星/土星等边缘出现严重锯齿断层）。
- **静态资源打包陷阱**：像 `2k_saturn.jpg` 这样通过 JS 字符串路径动态获取的超高清贴图，**必须放在 `static/`（配置为 Vite 的 `publicDir`）目录下**。如果放在 `src/` 下，Vite 在执行 `npm run build` 时会因为没有代码层的显式 `import` 而将它们丢弃，导致线上部署后一直卡在无尽的 Loading 动画。

### 3. UI / UX 规范
- **禁止使用 Emoji**：所有图标必须使用自定义的 SVG 矢量代码库（统一存放于 `icons.js` 中，包含 explore, tour, share, quest, eye, planet 等）。保证全站视觉的严肃与高级感。
- **移动端优先 (Mobile-first)**：
  - `<meta name="viewport" content="... maximum-scale=1.0, user-scalable=no">` 必须带上，同时对 `canvas` 设置 `touch-action: none` 彻底封死网页原生的双指放大。
  - `min-height: 100dvh` 与安全区适配 `env(safe-area-inset-bottom)` 是标配。
  - **组件布局**：控制台 (HUD) 无论 PC 还是移动端，统一保持在屏幕底部正中居中（如同 Mac Dock）。任务悬浮窗统一放置于屏幕左上角。
- **CSS 类名规范**：严格使用 BEM 变体命名，如 `.cosmos-ui`, `.cosmos-hud`, `.cosmos-hud__btn`, `.cosmos-btn--primary`，配以 CSS 变量进行颜色/间距控制。

---

## 三、 分步开发里程碑 (Implementation Plan)

### Phase 1: 骨架与引擎初始化
- 搭建 Vite + Three.js(WebGPU) 项目模板。
- 配置 WebGPURenderer，并添加 `WebGPU Fallback` UI，引导不支持的浏览器用户（如旧版 Chrome）查看静态海报。
- 实现带有平滑阻尼的 `OrbitControls` 或自定义相机控制器。

### Phase 2: 黑洞核心 (Raymarching) 与星场
- 引入光线追踪黑洞着色器（利用 TSL 节点）。包含事件视界与吸积盘。
- 实现 `CubeCamera` 与 `CubeRenderTarget` 引力透镜扭曲效果（注意实施 1/3 帧率节流优化）。
- 使用 `BufferGeometry` + `Points` 构建包含 6 万颗粒子的银河系背景。通过给顶点传入离散颜色值（蓝、白、橙红）来表现不同恒星的表面温度。

### Phase 3: 科普发现层 (UI Overlay)
- 开发基于 Vanilla JS 的组件：`CosmosUi`, `DiscoveryOverlay`, `GuidedTour`, `QuestTracker`。
- 将热点数据 (`facts.json`, `quests.json`) 与 3D 坐标绑定。
- 实现点击热点相机自动旋转并拉近，同时从底部升起知识卡片（BottomSheet CSS 动画）。
- 添加全局状态栏：自由探索、开启导览、分享进度、**隐藏标签 (eye icon)**。

### Phase 4: 添加远景行星与材质
- 引入外部高清贴图（如 2K 的土星本体及带 Alpha 通道的星环贴图）。
- 在黑洞远处放置基于标准 PBR 材质构建的气态巨行星，通过引力透镜观察其被扭曲的绝美画面。
- 增加对应的交互任务：“飞近远处的行星”。

### Phase 5: 部署与 Cloudflare Pages 适配
- 确保 `vite.config.js` 设置正确的 `base: './'`（若有需要），并检查所有的 `.jpg`、`.glb` 文件均位于正确的公共静态目录。
- 部署到 Cloudflare Pages，设置构建命令为 `npm run build`，输出目录为 `dist`。
- 在静态目录添加 `_redirects` 文件 (`/* /index.html 200`) 支持 SPA fallback，并提供 `_headers` 文件。

---

## 四、 核心科普文案配置 (参考模板)

**1. 任务系统配置 (`src/content/quests.json`)**
务必保证 `hotspotId` 在场景中有对应的节点，避免成为无法完成的死局任务：
```json
[
  {
    "id": "find-disk",
    "title": "找到发光的吸积盘",
    "description": "点击吸积盘热点，了解气体如何发光。",
    "hotspotId": "accretion-disk"
  },
  {
    "id": "main-star",
    "title": "查看主恒星",
    "description": "点击主恒星热点，把恒星的知识告诉爸爸妈妈。",
    "hotspotId": "sun"
  }
]
```

**2. 知识库配置 (`src/content/facts.json`)**
采用双轨文案：`child` (大白话比喻) + `parent` (硬核科学解释)。
*注：务必遵循科学严谨性，例如黑洞不是“吸尘器”，远处的行星应描述为“气态巨行星”而非“类似地球的岩石世界”。*
```json
{
  "event-horizon": {
    "title": "事件视界",
    "child": "这是黑洞的「边界线」。一旦越过，连光也逃不出来，就像瀑布边缘的水流。",
    "parent": "事件视界是广义相对论预言的零超曲面：对远处观测者而言，任何从此半径内向外的信号都无法逃逸。其大小与黑洞质量成正比（史瓦西半径 rs = 2GM/c²）。"
  },
  "distant-planet": {
    "title": "远处的行星",
    "child": "在黑洞很远的地方，有一颗带巨大光环的行星。它是气态巨行星，就像我们太阳系里的土星一样，并没有坚硬的固体表面。",
    "parent": "这颗系外气态巨行星通过极远处的主恒星照亮。气态行星若拥有如此壮观的星环系统，通常由无数冰块、岩石碎屑在洛希极限外围绕其赤道运转形成。"
  }
}
```

> **最终忠告给未来的 AI Agent**：当你接手读取此文档后，不要试图引入复杂的前端框架，紧扣 Three.js WebGPU 接口，用最原始纯粹的 JS 控制 DOM 状态。你的代码应当如同太空一般深邃且利落。
