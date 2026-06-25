# Cloudflare Pages 部署

## 一次性配置

1. 在 GitHub 创建仓库并推送 `e2n-cosmos` 目录
2. Cloudflare Dashboard → Workers & Pages → Create → Connect Git
3. 构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20+
4. 自定义域：`space.e2n.studio` → CNAME 到 `*.pages.dev`

本仓库已包含 [`wrangler.toml`](../wrangler.toml)，也可用 CLI：

```bash
npm run build
npx wrangler pages deploy dist --project-name=e2n-cosmos
```

## 环境说明

- 纯静态站点，无需 Pages Functions / env secrets（MVP）
- 学习进度存于浏览器 `localStorage`
- 分享深链：`?tour=1` 直达导览

## 可选：R2 HDRI

1. 从 [Poly Haven starmap_2020](https://polyhaven.com/a/starmap_2020) 下载 HDR
2. 上传至 R2 public bucket，例如 `https://assets.e2n.studio/cosmos/starmap.hdr`
3. 在 `Environment.js` 或后续迭代中引用（勿打进 bundle）

## 验收

- [ ] 生产 URL 首屏可加载（含 compileAsync）
- [ ] 无 WebGPU 时显示 fallback 文字导览
- [ ] `?dev=1` 生产环境勿默认开启
- [ ] 手机真机：导览 + 飞近 + 分享
