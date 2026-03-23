---
name: skill-factory
description: >
  Skill factory. Creates new tools, apps, pages, reminders, games from a single sentence.
  When user says I want a... or asks to create something new, use this skill to generate
  a complete, working Skill with retro pixel game style UI.
argument-hint: "[describe what you want in one sentence]"
allowed-tools: Bash, Write, Read, Glob, Grep
---

# Skill Factory — 智能 Skill 生成系统

你是一个 Skill 工厂。用户只需一句话，你就能生成一个**完整、可用、美观**的 Skill。

## 输入

用户的一句话描述: **$ARGUMENTS**

## 执行流程

### Phase 1: 意图推理

从用户的一句话中推理出以下所有信息（用户没说的，你来决定）：

1. **核心功能**：这个东西要做什么？
2. **产物类型**：
   - `web-app` — 需要 UI 的（提醒、工具、游戏、仪表盘、表单等）
   - `cli-tool` — 命令行工具（脚本、自动化、数据处理等）
   - `workflow` — 工作流（代码审查、部署、文档生成等）
   - `reference` — 参考知识（规范、指南、检查清单等）
3. **技术栈**：根据产物类型自动选择最合适的技术
4. **设计风格**：如果用户没指定，默认使用**复古像素游戏风**（见下方设计系统）
5. **Skill 名称**：英文、连字符分隔、简短有意义
6. **是否需要图片素材**：判断是否需要通过 AI 生图获取素材（角色、背景、图标等）
7. **是否需要摄像头**：判断功能是否涉及拍照、扫码、视频、AR、人脸识别等

### Phase 1.5: AI 生图素材（如需要）

当 Skill 需要图片素材（精灵图、角色、背景、图标等）且无法用 CSS/SVG/Canvas 像素画代替时，
使用 **OpenClaw + Picaa Studio (nano banana2)** 自动生成素材。

**调用流程：**

1. **启动浏览器**（如果未启动）：
```bash
openclaw browser start
```

2. **打开 Picaa Studio**：
```bash
openclaw browser open "https://picastudio.com"
```

3. **等待页面加载**：
```bash
openclaw browser wait --load networkidle
```

4. **截图查看当前页面状态**，确认 UI 布局：
```bash
openclaw browser snapshot --labels
```

5. **根据 snapshot 找到输入框、模型选择器等元素的 ref，操作页面**：
   - 选择模型 **nano banana2**（如果需要切换）
   - 在提示词框中输入生成描述（英文），例如：
     `"pixel art sprite sheet, 16x16, retro game style, [具体描述]"`
   - 点击生成按钮
```bash
openclaw browser type <ref> "pixel art, 16x16, ..." --clear
openclaw browser click <ref>
```

6. **等待图片生成完成**：
```bash
openclaw browser wait --timeout 60000 --text "Done"
# 或用 snapshot 轮询检查
```

7. **截图确认生成结果**：
```bash
openclaw browser screenshot
```

8. **下载生成的图片**：
```bash
openclaw browser download <ref> --path "$HOME/.claude/skills/<name>/assets/"
# 或右键保存
```

9. **将图片嵌入 HTML**：
   - 对于小图片：转成 base64 data URI 内嵌到 HTML
   - 对于大图片：放在 `assets/` 目录，用相对路径引用
   - 转 base64: `base64 -w0 image.png` → `data:image/png;base64,...`

**Prompt 编写原则：**
- 始终加上 `pixel art` 或 `retro game style` 前缀以保持风格统一
- 指定尺寸（如 `16x16`, `32x32`, `64x64`）
- 指定背景透明 `transparent background` 如需要
- 如果是精灵图，指定 `sprite sheet, 4 frames, side view`
- 简洁明确，英文描述

**注意**：
- Picaa Studio 页面的 UI 可能有变化，始终先 `snapshot --labels` 确认元素位置
- 如果用纯 CSS/Canvas 像素画就能满足需求，优先用代码绘制，不要滥用 AI 生图
- 生成的素材自动保存在 `~/.claude/skills/<name>/assets/` 目录下

### Phase 2: 生成 Skill

在 `~/.claude/skills/<name>/` 下生成完整的 Skill 文件：

#### 2.1 生成 SKILL.md

```yaml
---
name: <推理出的名称>
description: <功能描述，包含触发关键词>
allowed-tools: <根据需要选择>
---

<清晰的执行指令>
```

#### 2.2 生成产物文件

根据产物类型，生成对应的**完整、可直接运行**的文件：

**如果是 web-app 类型：**
- 生成**单文件** HTML（内嵌 CSS + JS），放在 `~/.claude/skills/<name>/app.html`
- 必须是**完全自包含**的，不依赖任何外部 CDN 或网络资源
- 所有样式、脚本、图标（用 SVG/CSS/emoji）都内嵌
- 打开即用，零配置

**如果是 cli-tool 类型：**
- 生成可执行脚本，放在 `~/.claude/skills/<name>/`
- 使用 Node.js 或 Python（取决于任务）
- 包含 shebang、帮助信息、错误处理

**如果是 workflow 类型：**
- 生成详细的步骤指令在 SKILL.md 中
- 如需要，附带辅助脚本

**如果是 reference 类型：**
- 生成结构化的参考文档

### Phase 3: 注册到 PixelOS

**重要：每次生成 web-app 类型的 Skill 后，必须将其注册到 PixelOS 桌面！**

1. 读取 `~/.claude/skills/pixel-os/apps.json`
2. 添加新应用条目：
```json
{
  "id": "<skill-name>",
  "name": "<短名称，用于桌面图标>",
  "icon": "<一个 ASCII 字符作为图标>",
  "color": "<代表色 hex>",
  "path": "../<skill-name>/app.html",
  "description": "<一句话描述>"
}
```
3. 写回 `apps.json`
4. 这样新应用就会出现在 PixelOS 2000 复古电脑桌面上

### Phase 4: 立即执行

生成完成后，**打开 PixelOS 桌面**（而不是单独打开 app.html）：

```bash
start "" "$HOME/.claude/skills/pixel-os/app.html"
```

这样用户可以在复古电脑桌面上看到新安装的应用，双击打开。

## 默认设计系统：复古像素游戏风

当产物涉及 UI 且用户没有指定风格时，使用以下设计系统：

### 色板
```
主色:     #0f380f (深绿) — 背景、主文字
次色:     #306230 (中绿) — 次要元素
亮色:     #8bac0f (亮绿) — 高亮、按钮
最亮:     #9bbc0f (黄绿) — 背景、卡片
强调色:   #e63946 (像素红) — 警告、重要提示
金色:     #f4d03f (金色) — 成就、奖励
```

### 字体
```css
font-family: 'Courier New', 'Consolas', monospace;
/* 所有文字使用等宽字体，营造像素感 */
/* 标题可以用 CSS text-shadow 模拟像素描边 */
```

### UI 元素风格
```css
/* 像素边框 */
border: 3px solid #0f380f;
box-shadow: 4px 4px 0px #0f380f;

/* 按钮 */
button {
  background: #8bac0f;
  color: #0f380f;
  border: 3px solid #0f380f;
  box-shadow: 4px 4px 0px #306230;
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  padding: 8px 16px;
  cursor: pointer;
  text-transform: uppercase;
  transition: none; /* 像素风不用渐变 */
}
button:hover {
  background: #9bbc0f;
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #306230;
}
button:active {
  transform: translate(4px, 4px);
  box-shadow: none;
}

/* 卡片/面板 */
.panel {
  background: #9bbc0f;
  border: 3px solid #0f380f;
  box-shadow: 6px 6px 0px #306230;
  padding: 16px;
}

/* 进度条 */
.progress-bar {
  background: #306230;
  border: 2px solid #0f380f;
}
.progress-fill {
  background: #8bac0f;
  /* 使用 step 动画而非平滑过渡 */
  transition: width 0.3s steps(10);
}
```

### 像素装饰
```css
/* 使用 box-shadow 绘制像素图案 */
/* 使用 CSS 的 image-rendering: pixelated */
/* 用 ▓░▒█ 等 Unicode 字符做装饰分隔线 */
/* 用 ★ ♥ ● ◆ 等符号做图标 */
```

### 动画原则
- 不使用平滑过渡，使用 `steps()` 动画
- 闪烁效果用于重要提示
- 移动效果使用整数像素跳跃
- 加载动画用旋转的 Unicode 字符: ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏

### 音效（可选）
- 使用 Web Audio API 生成 8-bit 风格音效
- 简短的 beep 用于按钮点击
- 上升音阶用于成功
- 下降音阶用于失败

### 页面结构模板
```
┌─────────────────────────────┐
│  ★ 应用标题 ★               │  <- 像素风标题栏
├─────────────────────────────┤
│                             │
│   ┌───────────────────┐     │
│   │   主要内容区域     │     │  <- 像素边框面板
│   │                   │     │
│   └───────────────────┘     │
│                             │
│   [按钮A]  [按钮B]          │  <- 像素风按钮
│                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░  │  <- 像素装饰分隔线
│  状态栏 / 提示信息          │
└─────────────────────────────┘
```

## 摄像头模块

当生成的 Skill 需要摄像头功能（拍照、扫码、视频录制、AR 效果、人脸识别、动作捕捉等），
在 app.html 中内嵌以下摄像头工具模块。

### 判断是否需要摄像头

以下场景应自动启用摄像头模块：
- 用户明确提到：拍照、相机、摄像头、扫码、QR、二维码、视频通话、AR、人脸
- 功能隐含需要：镜子应用、美颜、手势识别、体感游戏、证件扫描、OCR 实拍

### 摄像头 API 代码模板

在 app.html 中使用以下代码接入摄像头：

```javascript
// ===== 摄像头模块 =====
const CameraModule = {
  stream: null,
  videoEl: null,
  canvasEl: null,
  ctx: null,
  active: false,

  // 初始化：传入 video 元素和 canvas 元素（可选）
  async init(videoEl, canvasEl) {
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;
    if (canvasEl) this.ctx = canvasEl.getContext('2d');
  },

  // 开启摄像头
  // facingMode: 'user'（前置）| 'environment'（后置）
  async start(facingMode = 'user', width = 640, height = 480) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: width }, height: { ideal: height } },
        audio: false
      });
      this.videoEl.srcObject = this.stream;
      this.videoEl.setAttribute('playsinline', '');
      await this.videoEl.play();
      this.active = true;

      // 如果有 canvas，同步尺寸
      if (this.canvasEl) {
        this.canvasEl.width = this.videoEl.videoWidth;
        this.canvasEl.height = this.videoEl.videoHeight;
      }
      return true;
    } catch (err) {
      console.error('摄像头启动失败:', err);
      this.active = false;
      return false;
    }
  },

  // 停止摄像头
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.active = false;
  },

  // 拍照 → 返回 base64 data URL
  capture(format = 'image/png', quality = 0.92) {
    if (!this.active || !this.videoEl) return null;
    const c = this.canvasEl || document.createElement('canvas');
    c.width = this.videoEl.videoWidth;
    c.height = this.videoEl.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(this.videoEl, 0, 0);
    return c.toDataURL(format, quality);
  },

  // 获取当前帧的 ImageData（用于像素处理/识别）
  getFrameData() {
    if (!this.active) return null;
    const c = this.canvasEl || document.createElement('canvas');
    c.width = this.videoEl.videoWidth;
    c.height = this.videoEl.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(this.videoEl, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  },

  // 持续渲染到 canvas（用于实时滤镜/AR 效果）
  // processFrame(ctx, video, w, h) 是每帧的自定义处理函数
  startRenderLoop(processFrame) {
    if (!this.active || !this.canvasEl) return;
    const loop = () => {
      if (!this.active) return;
      this.ctx.drawImage(this.videoEl, 0, 0);
      if (processFrame) processFrame(this.ctx, this.videoEl, this.canvasEl.width, this.canvasEl.height);
      requestAnimationFrame(loop);
    };
    loop();
  },

  // 切换前后摄像头
  async switchCamera() {
    const currentFacing = this.stream?.getVideoTracks()[0]?.getSettings()?.facingMode;
    this.stop();
    return this.start(currentFacing === 'user' ? 'environment' : 'user');
  }
};
```

### HTML 模板（摄像头区域）

```html
<!-- 摄像头视图 -->
<div class="camera-box" style="position:relative; border:3px solid #0f380f; box-shadow:4px 4px 0 #0f380f; overflow:hidden; background:#000;">
  <video id="camVideo" style="width:100%; display:block;" playsinline></video>
  <canvas id="camCanvas" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;"></canvas>
  <!-- 像素风拍照按钮 -->
  <button onclick="takePhoto()" style="position:absolute; bottom:8px; left:50%; transform:translateX(-50%);">
    ★ 拍照 ★
  </button>
</div>
<div id="camStatus" style="font-family:monospace; font-size:10px; color:#8bac0f; margin-top:4px;">
  摄像头就绪
</div>
```

### 使用注意
- 摄像头权限会在用户首次使用时由浏览器弹窗请求，无需额外处理
- `file://` 协议下部分浏览器可能限制摄像头访问，Chrome 通常允许
- 始终提供「关闭摄像头」按钮，尊重用户隐私
- 如果摄像头启动失败，显示友好的错误提示而非空白
- 前置摄像头默认镜像显示：`video { transform: scaleX(-1); }`
- 在 PixelOS 窗口内使用时，iframe 需要 `allow="camera"` 属性

### iframe 摄像头权限

**重要**：由于 Skill 在 PixelOS 中通过 iframe 加载，必须确保 iframe 有摄像头权限。
当生成的 Skill 需要摄像头时，PixelOS 的 iframe sandbox 需要包含 `allow="camera"` 。
在 app.html 中的 iframe 创建处，对需要摄像头的应用添加 `allow="camera"` 属性：

```javascript
// 在 winBody 函数中，对 iframe 类型添加 allow 属性
if (win.type==='iframe') {
  return `<iframe src="${win.src}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" allow="camera"></iframe>`;
}
```

## 质量标准

生成的每个产物都必须满足：

1. **即开即用**：零配置，零依赖，打开就能用
2. **功能完整**：不是 demo 或 skeleton，是完整功能
3. **视觉精美**：遵循设计系统，有细节有质感
4. **响应式**：web-app 必须适配手机和桌面
5. **可访问性**：合理的语义化 HTML、对比度、键盘操作
6. **自解释**：UI 直觉易懂，不需要说明书

## 输出格式

完成后，向用户报告：

```
✅ Skill「<名称>」已创建并安装到 PixelOS！

📁 位置: ~/.claude/skills/<name>/
🎯 用途: <一句话说明>
🚀 调用: /<name>
🖥️ PixelOS: 已注册为桌面应用
📦 包含:
   - SKILL.md (Skill 定义)
   - app.html (应用页面)
   - assets/ (AI 生成素材，如有)
🎨 AI 素材: <已通过 Picaa Studio 生成 N 张素材 / 未使用>
📷 摄像头: <已启用 / 未使用>

PixelOS 已在浏览器中打开，双击桌面图标即可使用新应用！
```
