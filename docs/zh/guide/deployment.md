# 发布到 GitHub Pages

## 站点与分支

仓库 GitHub 远端为 `https://github.com/enmotion/vmo-store`，部署分支为 `master`。文档目标地址：

```text
https://enmotion.github.io/vmo-store/
```

VitePress `base` 为 `/vmo-store/`。英文位于站点根目录，中文位于 `/zh/`。保留 HTML 链接，兼容静态主机的深层页面访问。

## 启用 Pages

在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。部署任务需要 `pages: write` 和 `id-token: write` 权限。

将验证通过的修改推送到 `master`，或在 `master` 手动运行工作流。Pull Request 只检查，不部署。工作流构建站点、使用真实浏览器验证、上传 `docs/.vitepress/dist`，然后通过 `github-pages` 环境发布。

```sh
npm run docs:build
npm run docs:preview
```

发布前在 `/vmo-store/` 路径预览构建结果，包括深层页面。浏览器测试提供独立静态服务器，并测试完全相同的基础路径。

## 其他仓库或域名

复用文档时修改 `base`、sitemap 主机地址、GitHub/编辑链接和部署分支。自定义根域名使用 `base: '/'` 并在 GitHub Pages 配置域名。不要提交 `.vitepress/dist`，也不要把文档源码目录当作静态产物上传。

## 排查问题

| 现象 | 检查 |
| --- | --- |
| Pages 配置报错 | Source 应为 GitHub Actions，仓库及账号需要支持 Pages |
| CSS 或脚本丢失 | `base` 是否与仓库子路径一致 |
| 深层链接 404 | 保留生成的 `.html` 链接，上传完整输出目录 |
| 工作流无法部署 | Actions 权限与 `github-pages` 环境保护规则 |
| 浏览器任务启动失败 | 是否执行 Playwright 浏览器与系统依赖安装 |

参考：[VitePress 部署指南](https://vuejs.github.io/vitepress/v1/guide/deploy)。
