# 工程约束（2026-06）

1. three >= 0.183.0；统一 `import ... from 'three/webgpu'` + `three/tsl`
2. 必须 `await renderer.init()` 后再渲染
3. 后期：`RenderPipeline`（禁止 EffectComposer / 旧 PostProcessing 名）
4. TSL 用 Fn()/uniform/instancedArray；禁止 GLSL 字符串（行星阶段亦然）
5. 粒子系统：单一 SpriteNodeMaterial + storage buffer；禁止 per-instance unique colorNode
6. 首帧：`renderer.compileAsync(scene, camera)` + loading UI；可选 `asyncCompilation: true`（r184+）
7. 部署：Cloudflare Pages 纯静态；>5MB 资产走 R2 public URL
8. 儿童模式：默认隐藏 Tweakpane；`prefers-reduced-motion` 停动画
9. 视觉专业度：全站禁止 emoji；图标仅用 `src/Experience/Cosmos/icons.js` / assets 统一 SVG
10. mobile-first：先 320–430px 布局；`100dvh` + `viewport-fit=cover` + safe-area
11. 移动性能：DeviceProfile 分档 starCount/pixelRatio；帧率 <24fps 自动降档
12. 科普层与 WebGPU 层解耦：overlay 纯 DOM；文案读 `src/content/*.json`
13. 儿童版单卡正文 ≤ 80 字；家长扩展 ≤ 200 字
14. 分享/进度仅 localStorage
15. canvas 与 overlay 手势分层：导览/Sheet 打开时禁用 canvas pointer-events
