# 验证记录 / Validation record

日期：2026-10-10（Asia/Shanghai）。本地环境：macOS / Apple Silicon，Node.js 24.14.1。

| 验证 | 结果 |
| --- | --- |
| 干净安装 `npm ci` | 通过 |
| 单元测试 | 144 / 144 通过，无跳过 |
| 生产实现语句 / 分支 / 函数 / 行覆盖率 | 100% / 100% / 100% / 100% |
| 库构建与 TypeScript 检查 | 通过 |
| ESM/CJS 运行时及严格 NodeNext 声明 | 通过 |
| VitePress 中英文静态生成 | 通过 |
| 跨浏览器测试 | 135 / 135 通过，无重试、跳过或 flaky |
| 可见 Chromium 浏览器复测 | 27 / 27 通过 |
| 原有 Vue 演示页与 Tailwind 样式回归 | 真实 Chromium 中通过，运行时异常为 0 |
| 依赖审计（含开发依赖） | 0 个已知漏洞 |

## 浏览器范围

Chromium（Chrome for Testing 156）、Firefox 157、WebKit 27.2，每个引擎 27 项场景。另有移动 Chromium（Pixel 7）与移动 WebKit（iPhone 13）两种模拟视口，每种 27 项；它们不属于实体设备测试。

使用构建后的 ESM/UMD 包及真实 localStorage/sessionStorage，验证：页面刷新、独立标签页和上下文隔离、实例快照、真实时间过期、原生 QuotaExceededError、容量失败后的内存一致性、命名空间清理、特殊字符版本清理、损坏缓存隔离、函数闭包与禁用字符串执行、Unicode 密钥、复杂类型恢复、嵌套编辑和移除默认值。

文档验证包括：两种语言全部指南/API 深层链接、真实语言菜单切换、导航、搜索、深色模式保持、交互示例的保存/刷新/清理、移动视口溢出检查和运行时异常检查。已检查桌面和移动截图。

## 覆盖率范围

包含 `index.ts` 和全部 `use.lib/**/*.ts`。纯导出入口没有可执行语句，分母为 0；四个生产实现模块的全部可执行指标均为 100%。没有使用忽略注释或排除生产分支。文档、构建工具及演示页属于独立验证目标。

Vitest 更新为 4.1.11，V8 覆盖率采用 AST 映射；与旧版的计数方式不同，因此总语句/行数变化，但执行覆盖率仍为 100%。当前计数：248/248 语句、203/203 分支、49/49 函数、194/194 行。

## 重现

```sh
npm ci
npx playwright install chromium firefox webkit
npm run verify
npm run test:e2e:headed -- --project=chromium
npm audit
```

测试报告位于 `test/reports/unit/coverage/` 和 `test/reports/browser/`，GitHub Actions 上传完整验证报告。移动测试为设备行为模拟，缓存库不承诺跨后端事务或自动跨标签页同步。

## 工具链

文档使用稳定版 VitePress 1.6.4；通过 npm overrides 统一到经过验证的 Vite 7.3.7 与 Vue 插件 6，以消除旧开发服务器依赖的已知漏洞。旧声明生成插件已替换为 TypeScript 原生声明构建。测试更新为 Vitest 4.1.11；原有演示样式更新为 Tailwind 4。库仍没有运行时第三方依赖。
