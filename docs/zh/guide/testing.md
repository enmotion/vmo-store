# 测试与验证

## 本地验证

建议使用 Node.js 24，也支持 Node.js 20.19+/22.12+ 的对应版本：

```sh
npm ci
npx playwright install chromium firefox webkit
npm run verify
```

`verify` 依次执行覆盖率、库构建、发布包验证、文档构建和真实浏览器测试。Linux 环境可能需要 `npx playwright install --with-deps`。

## 覆盖率要求

`npm run coverage` 要求**每个生产文件的语句、分支、函数和行覆盖率均为 100%**。范围包括 `index.ts` 与全部 `use.lib/**/*.ts`；示例、文档、构建工具和类型声明使用独立验证，不计入库覆盖率。没有为达到数值而排除生产分支。

单元测试覆盖刷新恢复、损坏内容隔离、命名空间清理、期限边界、容量与写入失败、复杂类型、Unicode 混淆及旧格式读取。覆盖率衡量执行路径，不代表不存在缺陷。

## 真实浏览器矩阵

`npm run test:e2e` 使用 Chromium、Firefox、WebKit，以及移动 Chromium 和移动 WebKit 视口。测试加载构建产物，使用真实 Web Storage、页面刷新、独立标签页和浏览器上下文。移动项目模拟视口和设备行为，不属于实体设备测试。

文档测试检查两种语言、导航、本地搜索、`/vmo-store/` 下的深层链接、响应式溢出和交互示例。报告与 trace 位于 `test/reports/browser/`。

```sh
npm run test:e2e:headed  # 可见浏览器
npm run test:e2e:report  # 打开 HTML 报告
```

## 发布包验证

`npm run test:package` 验证 ESM/CJS 导入、复杂值恢复，以及两种模块格式的严格 NodeNext 类型声明解析。

CI 执行相同验证，只有可信的 `master` 推送通过检查后才会部署文档。
