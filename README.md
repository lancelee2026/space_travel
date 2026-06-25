# e2n-cosmos — 深空互动科普馆

基于 [Singularity](https://github.com/MisterPrada/singularity) WebGPU 黑洞演示，扩展为儿童天文科普体验。

## 开发

```bash
cd e2n-cosmos
npm install
npm run dev
```

打开 `https://localhost:5173/`（需 WebGPU 浏览器）。

- 调试面板：URL 加 `?dev=1`
- 直达导览：URL 加 `?tour=1`

## 构建与部署

详见 [`docs/DEPLOY.md`](docs/DEPLOY.md)。

```bash
npm run build
npx wrangler pages deploy dist --project-name=e2n-cosmos
```

目标域名：`space.e2n.studio`

## 文档

- `docs/ENGINEERING_CONSTRAINTS.md` — vibe coding 前置约束
- `docs/SCIENCE_CONTENT.md` — 科普文案规范
- `docs/UI_UX_GUIDELINES.md` — overlay UI 规范
- `docs/MOBILE_UX.md` — 移动端沉浸式规范

## 致谢 (Acknowledgments)

本项目的基础黑洞 WebGPU 渲染核心以及部分视觉灵感来源于以下优秀的开源项目与技术：

- **[Singularity](https://github.com/MisterPrada/singularity)**: 感谢 MisterPrada 开源的非凡 WebGPU 黑洞物理渲染演示，构成了本项目核心视觉的基础。
- **[Three.js](https://threejs.org/)**: 强大的 WebGL/WebGPU 3D 引擎。
- **[GSAP](https://gsap.com/)**: 行业标准的丝滑动画库，为镜头运镜与导览体验提供动力。
- **[Vite](https://vitejs.dev/)**: 极速前端构建工具。
- **[Tweakpane](https://tweakpane.github.io/docs/)**: 优雅的图形调试界面。
- 感谢所有为 Web 3D 与天文物理可视化做出贡献的开源社区开发者。
