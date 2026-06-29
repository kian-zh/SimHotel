# SimHotel · 酒店模拟

基于 Mapbox 真实地图的连锁酒店策略经营 Web 游戏。从 1990 年香港起步，通过定价策略与 AI 对手争夺亚太及全球市场。

## 快速开始

```bash
# 安装依赖
npm install

# 配置 Mapbox Token（复制 .env.example 为 .env.local 并填入 token）
cp .env.example .env.local

# 开发
npm run dev

# 构建
npm run build

# 单元测试
npm run test

# E2E 测试（需先安装浏览器：npx playwright install chromium）
npm run test:e2e
```

## 技术栈

- **React 18 + TypeScript + Vite** — UI 与构建
- **Mapbox GL JS** — 真实地理地图
- **Zustand + Immer** — 游戏状态
- **自研 Tick 引擎** — 固定节奏模拟（5 秒/游戏日，暂停 / 快进下月）
- **Framer Motion** — 过渡动画
- **Recharts** — 统计仪表盘
- **Dexie.js** — IndexedDB 本地存档

## 游戏玩法

1. 输入品牌名开始游戏（初始资金 $8,000,000，起点香港）
2. 在已开放城市选址建造酒店，配置客房类型与公共设施（空间模型）
3. 调整房价、装修设施、雇佣人员争夺市场份额
4. 利用顶栏暂停决策，或使用「快进下月」跳过整月
5. 顶栏资金以 `$8,000,000 (+$12,000)` 格式显示当日净变化
6. 关注历史事件对市场的影响
7. 在统计总览的「扩张」页支付开城费用，解锁深圳、东京、纽约等新市场
8. 研发技术树，解锁高级设施、房型与广告形式
9. 在统计面板中切换集团战略（稳健、扩张、奢华、精益、防守），影响成本、吸引力和声誉
10. 收购 AI 对手酒店或出售自有资产；投放集团品牌广告与单店广告
11. 使用资本市场融资扩张，并管理负债、信用评级、利息和现金流风险

## 项目结构

```
src/
├── components/   # UI 组件（地图、HUD、面板、图表）
├── game/         # 模拟内核（引擎、市场、AI、事件、财务、存档）
├── data/         # 城市、竞争对手、历史事件配置
├── stores/       # Zustand 状态
└── i18n/         # 中英文
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_MAPBOX_TOKEN` | Mapbox 公开 token（勿提交到 Git） |

## 设计规划

本项目的长期方向是从酒店经营 MVP 扩展为类似“欧陆风云”的宏大历史经营策略游戏：玩家在真实历史事件、城市增长、资本周期和竞争集团之间制定长期战略。

详细规划见 [`docs/GAME_DESIGN_ROADMAP.md`](docs/GAME_DESIGN_ROADMAP.md)。完整项目文档（技术架构、交互设计、UI 风格、酒店经营系统）见 [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md)。
