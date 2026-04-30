# Super Tab Out 未来升级 Todo

本清单按优先级整理，目标是在保持本地优先、无需账号、隐私友好的前提下，把 Super Tab Out 从“新标签页看板”升级为“AI 辅助的标签整理控制台”。

## P0 - 可靠性与实用闭环

- [ ] 增加命名会话保存能力：支持保存当前窗口、所有窗口、标签顺序、Chrome Tab Groups、pinned 状态。
- [ ] 增加会话恢复能力：支持恢复到当前窗口、新窗口，并允许只恢复会话中的部分标签。
- [ ] 为高风险操作增加 Undo：覆盖关闭全部、关闭分组、清理重复、保存稍后、删除已保存条目。
- [ ] 增加导入/导出：支持 JSON、Markdown、纯 URL 列表，并预留 OneTab 文本格式导入。
- [ ] 增加自动备份与数据迁移：为 `chrome.storage.local` 数据加入 schema version、迁移函数和备份快照。
- [ ] 增加基础测试：覆盖 pinned 保护、精确 URL 关闭、重复标签清理、XSS escape、会话保存恢复。
- [ ] 增加发布校验脚本：校验 manifest、JS 语法、zip 内容、是否误包含 `config.local.js` 或本地调试文件。

## P1 - 高频入口与效率

- [ ] 增加 Chrome Side Panel：在不离开当前网页的情况下搜索、保存、关闭、恢复标签。
- [ ] 增加 manifest `commands`：支持全局快捷键打开侧边栏、保存当前会话、切换隐私模式。
- [ ] 增加 omnibox 搜索：例如输入 `sto github` 后搜索打开标签、已保存会话和稍后再看条目。
- [ ] 增强搜索体验：支持模糊搜索、高亮匹配、按标题/URL/域名/分组过滤。
- [ ] 增强 Chrome Tab Groups 操作：支持从域名卡片创建原生分组、重命名、改色、折叠、保存分组。
- [ ] 增加最近关闭恢复：基于 `chrome.sessions` 展示最近关闭的标签或窗口，并支持一键恢复。

## P2 - AI 差异化能力

- [ ] 增加 AI 自动分组建议：根据标题、URL、域名和现有分组，把标签建议归入项目、资料、待阅读、娱乐等类别。
- [ ] 增加 AI 会话命名：保存一组标签时自动生成简洁名称，例如“Chrome MV3 扩展开发资料”。
- [ ] 增加 AI 清理建议：指出重复页、首页/搜索页、长期未访问标签和可归档标签。
- [ ] 增加 AI 会话摘要：为保存的 session 生成一句上下文说明，方便未来恢复时快速理解。
- [ ] 增加 AI 隐私开关：默认只发送标题、URL、域名和分组，不读取页面正文；支持完全关闭 AI。
- [ ] 预留用户自带 API Key 方案：不内置账号体系，保持本地优先和低运营成本。
- [ ] 评估本地模型或浏览器内模型：作为未来可选方案，减少外部请求和隐私顾虑。

## P3 - 趣味性与留存

- [ ] 增加 Tab Health 分数：综合打开标签数、重复数、未分组数、长时间未访问数给出当前状态。
- [ ] 增加整理成就：例如清理 100 个标签、连续 5 天保持低标签数、完成 10 次重复清理。
- [ ] 增加轻量统计面板：展示本周关闭/保存标签数、最常访问域名、重复标签减少量。
- [ ] 增加每日/每周整理摘要：用简短文案回顾浏览压力变化和整理成果。
- [ ] 优化关闭与归档反馈：保留当前轻量动画和声音，但增加关闭音效、减少动效、无动效模式。
- [ ] 增加主题收藏或随机主题：让高频使用更有新鲜感，但不影响主流程效率。

## 架构与维护

- [ ] 拆分 `extension/app.js`：按 tabs service、storage service、renderers、i18n、actions、privacy、themes 组织。
- [ ] 评估是否引入最小构建链路：优先保持简单，但为 ES modules、测试和打包提供基础。
- [ ] 抽象存储层：统一处理 `chrome.storage.local`、`localStorage`、schema version、quota 和错误提示。
- [ ] 补充无障碍能力：为 icon-only 按钮补齐 `aria-label`，完善键盘导航和焦点状态。
- [ ] 增加 `prefers-reduced-motion` 支持：尊重系统减少动态效果设置。
- [ ] 增加隐私增强选项：允许用户禁用外部 favicon 请求，强化本地优先定位。

## 推荐执行顺序

1. P0 先完成会话保存/恢复、Undo、导入导出和基础测试。
2. P1 再做侧边栏、快捷键、omnibox 和最近关闭恢复。
3. P2 在实用闭环稳定后接入 AI 分组、命名、摘要和清理建议。
4. P3 最后补趣味化、统计和成就，让产品更有长期使用动力。

## 落地计划与版本里程碑 - 2026-04-30

总目标：把 Super Tab Out 从“新标签页标签看板”升级为本地优先的 Tab Command Center。新标签页负责整体整理，Side Panel 负责随时搜索、跳转、保存、关闭和恢复，omnibox 与 commands 提供键盘入口，P3 统计与成就用于增强长期留存，侧边栏工具箱作为轻量辅助能力。

### 阶段计划

- [x] 阶段 0 - 基础治理：拆分 `extension/app.js`，抽象 tabs/storage/search/actions/metrics 服务，加入 storage schema version、迁移函数、quota 与错误提示，并补最小校验链路。
- [x] 阶段 1 - 搜索核心升级：建立统一搜索索引，覆盖 title、URL、domain、Chrome group title、saved-for-later 和 saved sessions，支持模糊搜索、高亮匹配和 `domain:` / `group:` / `url:` / `saved:` 过滤语法。
- [x] 阶段 2 - 快捷入口：增加 manifest `commands` 与 omnibox keyword `sto`，支持打开侧边栏、搜索标签、跳转标签、保存会话和触发核心整理动作。
- [x] 阶段 3 - Side Panel MVP：新增侧边栏页面，支持在不离开当前网页的情况下搜索、跳转、保存稍后、关闭标签、清理重复和查看最近关闭入口。
- [x] 阶段 4 - Chrome Tab Groups 增强：支持从域名卡片创建原生分组，并支持重命名、改色、折叠、展开、取消分组和保存分组。
- [x] 阶段 5 - 最近关闭恢复：基于 `chrome.sessions` 展示最近关闭的 tab/window，支持一键恢复，并明确与 Super Tab Out 自己的 Undo 能力区分。
- [x] 阶段 6 - P3 留存：增加 Tab Health 分数、轻量统计面板和整理成就，统计本周关闭/保存标签数、重复减少量和最常整理/出现的域名。
- [x] 阶段 7 - 侧边栏工具箱：在 Side Panel 增加本地运行的 Tools tab，提供 JSON 查看/格式化/压缩/校验、二维码编码和时间戳转换。

### 版本里程碑

- [x] v1.1：架构拆分 + 搜索升级 + 无障碍/动效/favicon 隐私选项。
- [x] v1.2：commands + omnibox。
- [x] v1.3：Side Panel MVP。
- [x] v1.4：Tab Groups 操作 + 最近关闭恢复。
- [x] v1.5：Tab Health + 统计 + 成就。
- [x] v1.6：Side Panel Tools。

### 横向任务

- [x] 为 icon-only 按钮补齐 `aria-label`。
- [x] 完善键盘导航和 focus 状态。
- [x] 增加 `prefers-reduced-motion` 支持。
- [x] 增加禁用外部 favicon 请求的隐私选项。
- [x] 更新 README / PRIVACY / STORE_LISTING，解释新增权限、侧边栏入口和本地工具箱。
- [ ] 做 Chrome / Edge / Brave 手动回归。（Chrome/Edge 启动回归已跑；本机未安装 Brave）
- [x] 增加基础自动化测试，覆盖 pinned 保护、精确 URL 关闭、重复清理、XSS escape、搜索索引和 storage migration。
