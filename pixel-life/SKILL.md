---
name: pixel-life
description: Diva的像素生活。摄像头实景变像素空间，Diva在里面真实生活、互动。当用户想要像素生活、Diva房间、像素世界、虚拟生活时使用。
allowed-tools: Bash, Read, Write, Edit
---

# Diva's Pixel Life

打开 Diva 的像素生活世界。摄像头拍到的真实环境会被转化为像素风格的房间，Diva 会在里面真实生活：走动、工作、吃饭、睡觉、与你互动。

## 功能
- 摄像头实景 → 像素化房间转换（实时色彩量化 + 边缘描边）
- Gemini Vision AI 场景识别（检测桌子、杯子、电脑等物体）
- Diva 角色使用 PNG 精灵图 + 程序化动画（呼吸、弹跳、交叉淡入淡出）
- AI Brain 驱动生活逻辑（Gemini 2.5 Flash）
- 每5分钟自动环境变化检测，发现新场景自动添加房间
- 多房间系统：Diva 可以在不同房间之间移动
- 点击画面让 Diva 走到指定位置
- 文字对话互动

## 执行

在新标签页中打开：

```bash
start "" "$HOME/.claude/skills/pixel-life/app.html"
```
