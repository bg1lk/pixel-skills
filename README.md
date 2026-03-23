# PixelOS Skill Library — 完整复现指南

> 本仓库包含 PixelOS 2000 复古像素桌面系统的全部 30 个 Skill（应用），可一比一复现整个 Skill 库。

## 目录结构

```
pixel-skills/
├── pixel-os/              # 🖥️ 主桌面系统（入口）
│   ├── app.html           # PixelOS 2000 桌面（启动入口）
│   ├── apps.json          # 应用注册表（所有应用的元数据）
│   └── SKILL.md           # Skill 定义文件
├── skill-factory/         # 🏭 Skill 工厂（创建新应用的完整 prompt）
│   └── SKILL.md           # 包含完整设计系统、摄像头模块、生成流程
├── cam-core/              # 📷 摄像头共享模块
│   └── cam-core.js        # 可复用的摄像头 API
├── <skill-name>/          # 每个 Skill 一个文件夹
│   ├── app.html           # 单文件 HTML 应用（自包含，零依赖）
│   ├── SKILL.md           # Skill 定义（名称、描述、触发词、执行指令）
│   ├── gen.js             # （部分有）生成/辅助脚本
│   └── assets/            # （部分有）图片素材（精灵图等）
└── README.md              # 本文件
```

## 核心架构

### 1. PixelOS 2000 桌面系统 (`pixel-os/app.html`)

这是整个系统的入口，模拟 Windows 2000 风格的复古像素桌面：
- 桌面图标网格 → 双击打开应用
- 窗口管理器 → 拖拽、缩放、最大化、最小化、关闭
- 底部任务栏 → 开始菜单、活动窗口、时钟
- **所有子应用通过 iframe 加载**，路径为相对路径 `../skill-name/app.html`
- 已适配移动端（触摸操作、响应式布局、自动最大化窗口）

### 2. 应用注册表 (`pixel-os/apps.json`)

JSON 数组，每个应用一条记录：
```json
{
  "id": "cat-pet",          // 唯一标识，与文件夹名一致
  "name": "猫咪",            // 桌面图标显示名（2-4 字）
  "icon": "+",              // 单个 ASCII 字符作为图标
  "color": "#f878f8",       // 图标代表色
  "path": "../cat-pet/app.html",  // 相对于 pixel-os/ 的路径
  "description": "像素小猫养成游戏",  // 一句话描述
  "camera": true            // （可选）需要摄像头的应用标记为 true
}
```

### 3. 单文件 HTML 应用

每个 Skill 的 `app.html` 遵循以下原则：
- **完全自包含**：HTML + CSS + JS 全部内嵌，不依赖任何 CDN 或外部资源
- **零配置**：浏览器直接打开即可运行
- **统一像素风格**：使用统一的设计系统（见下方）
- **响应式**：同时适配桌面和手机
- **如需摄像头**：使用 `navigator.mediaDevices.getUserMedia` API

### 4. SKILL.md 定义格式

每个 Skill 的 SKILL.md 包含 YAML frontmatter + 执行指令：
```yaml
---
name: skill-name
description: >
  功能描述。包含触发关键词，用于匹配用户意图。
  当用户想要 XXX 时使用。
allowed-tools: Bash, Write, Read  # 允许使用的工具
---

# 标题

执行说明...
```

## 设计系统

所有应用使用统一的复古像素游戏风格：

### 色板
| 用途 | 颜色 | HEX |
|------|------|-----|
| 主色/深绿 | 背景、主文字 | `#0f380f` |
| 次色/中绿 | 次要元素 | `#306230` |
| 亮色/亮绿 | 高亮、按钮 | `#8bac0f` |
| 最亮/黄绿 | 背景、卡片 | `#9bbc0f` |
| 强调色/红 | 警告、重要 | `#e63946` |
| 金色 | 成就、奖励 | `#f4d03f` |

### 字体
```css
font-family: 'Courier New', 'Consolas', monospace;
```

### UI 组件风格
```css
/* 像素边框 */
border: 3px solid #0f380f;
box-shadow: 4px 4px 0px #0f380f;

/* 按钮 */
button {
  background: #8bac0f; color: #0f380f;
  border: 3px solid #0f380f;
  box-shadow: 4px 4px 0px #306230;
  font-family: monospace; font-weight: bold;
  padding: 8px 16px; cursor: pointer;
  text-transform: uppercase; transition: none;
}
button:hover { background: #9bbc0f; transform: translate(2px,2px); box-shadow: 2px 2px 0 #306230; }
button:active { transform: translate(4px,4px); box-shadow: none; }

/* 动画用 steps() 而非平滑过渡 */
```

### 页面结构
```
┌─────────────────────────────┐
│  ★ 应用标题 ★               │  ← 像素风标题栏
├─────────────────────────────┤
│   ┌───────────────────┐     │
│   │   主要内容区域     │     │  ← 像素边框面板
│   └───────────────────┘     │
│   [按钮A]  [按钮B]          │  ← 像素风按钮
│  ░░░░░░░░░░░░░░░░░░░░░░░  │  ← 装饰分隔线
│  状态栏信息                  │
└─────────────────────────────┘
```

## 摄像头模块

需要摄像头的应用（`apps.json` 中 `camera: true`）使用以下模式：

```javascript
const CameraModule = {
  stream: null, videoEl: null, canvasEl: null, ctx: null, active: false,
  async init(videoEl, canvasEl) { /* 初始化 */ },
  async start(facingMode = 'user', width = 640, height = 480) { /* 开启摄像头 */ },
  stop() { /* 关闭摄像头 */ },
  capture(format = 'image/png') { /* 拍照返回 base64 */ },
  getFrameData() { /* 获取当前帧 ImageData */ },
  startRenderLoop(processFrame) { /* 实时渲染循环 */ },
  async switchCamera() { /* 切换前后摄像头 */ }
};
```

PixelOS 中 iframe 需要 `allow="camera;microphone"` 属性。

## 全部 30 个应用

### 桌面宠物 & 养成
| Skill | 描述 | 摄像头 |
|-------|------|--------|
| cat-pet | 像素小猫养成（喂食、玩耍、睡觉） | ❌ |
| desktop-goose | 像素大鹅桌宠（追鼠标、嘎嘎叫） | ❌ |
| naruto-pet | 鸣人像素桌宠（忍术、吃拉面） | ❌ |
| ar-pet | AR 像素宠物（摄像头中养宠物） | ✅ |
| pixel-life | Diva 的像素生活（实景变像素世界） | ✅ |

### 创意 & 娱乐
| Skill | 描述 | 摄像头 |
|-------|------|--------|
| pixel-paint | 像素画板（画笔、橡皮、填充等工具） | ✅ |
| claude-room | Claude 的等距像素房间（家具装饰） | ❌ |
| anime-filter | 实时二次元滤镜（多种动漫风格） | ✅ |
| manga-panel | 实时漫画分镜机（对话气泡、音效） | ✅ |
| shanghai-cat-tour | 上海猫咪旅行地图（像素风地图） | ❌ |
| dice-roller | 随机决定器（转盘动画） | ❌ |

### 效率工具
| Skill | 描述 | 摄像头 |
|-------|------|--------|
| pomodoro | 番茄钟专注计时器 | ❌ |
| todo-list | 像素待办清单 | ❌ |
| pixel-clock | 时钟 + 秒表 + 倒计时 | ❌ |
| note-pad | 像素笔记本（多条笔记、搜索） | ❌ |
| expense-tracker | 像素风记账本 | ❌ |
| room-organizer | 房间整理分类助手 | ✅ |

### 健康 & 办公
| Skill | 描述 | 摄像头 |
|-------|------|--------|
| posture-check | 坐姿矫正器 | ✅ |
| eye-guardian | 护眼卫士（20-20-20 法则） | ✅ |
| seat-tracker | 久坐提醒 + 拉伸运动 | ✅ |
| breath-coach | 压力呼吸教练（4-7-8 放松法） | ✅ |
| water-reminder | 智能喝水追踪（摄像头检测水杯） | ✅ |
| light-meter | 光线检测器（护眼提醒） | ✅ |
| mood-buddy | 情绪检测安慰伙伴 | ✅ |

### 监控 & 安全
| Skill | 描述 | 摄像头 |
|-------|------|--------|
| boss-radar | 摸鱼辅助器（检测身后有人） | ✅ |
| away-lock | 离席自动锁屏 | ✅ |
| pet-monitor | 宠物监控（活动日报） | ✅ |
| delivery-watch | 快递监控（门口来人检测） | ✅ |

### 系统
| Skill | 描述 |
|-------|------|
| pixel-os | PixelOS 2000 桌面系统（入口） |
| skill-factory | Skill 工厂（一句话创建新应用） |

## 如何一比一复现

### 方法一：直接使用
1. 克隆本仓库
2. 浏览器打开 `pixel-os/app.html`
3. 所有 30 个应用已就绪

### 方法二：作为 Claude Code Skill 安装
1. 将所有文件夹复制到 `~/.claude/skills/`
2. Claude Code 会自动识别每个 SKILL.md 并注册为可用 Skill
3. 用户输入 `/pixel-os` 即可打开桌面

### 方法三：让 AI 从零复现
按照以下顺序创建：

1. **创建 pixel-os**：先做桌面系统框架（`app.html` + 空的 `apps.json`）
2. **创建 cam-core**：摄像头共享模块
3. **逐个创建应用**：每个应用是一个文件夹，包含 `app.html` + `SKILL.md`
4. **注册应用**：每创建一个应用，在 `apps.json` 中添加对应条目
5. **创建 skill-factory**：最后安装 Skill 工厂，用于后续扩展

**关键规则**：
- 每个 `app.html` 必须是完全自包含的单文件 HTML
- 使用上方统一的像素风设计系统
- 需要摄像头的应用在 `apps.json` 中标记 `"camera": true`
- 所有路径使用相对路径
- 素材文件（PNG 精灵图）放在对应 Skill 的 `assets/` 目录

## 素材说明

部分应用包含 PNG 精灵图素材（通过 AI 生图生成）：

- `ar-pet/assets/` — chibi 和 naruto 角色精灵图（11 + 11 张）
- `naruto-pet/assets/` — 鸣人动作精灵图（8 张，含透明版）
- `pixel-life/assets/` — Diva (典书) 角色 Top-Down 精灵图（10+ 张）

这些素材是 PNG 格式，像素风，透明背景。如需复现，可用 AI 生图工具按相同描述重新生成。
