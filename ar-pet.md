---
name: ar-pet
description: AR像素宠物。摄像头画面中养像素宠物(猫/狗/龙/兔/史莱姆/鸣人)，支持手势互动、IP上传、OpenClaw远程控制。当用户想要AR宠物、增强现实、AR猫、摄像头宠物、鸣人AR时使用。
allowed-tools: Bash
---

# AR Pet - AR像素宠物

打开AR像素宠物应用：

```bash
start "" "$HOME/.claude/skills/ar-pet/app.html"
```

## OpenClaw 远程控制

OpenClaw 可通过 `petAPI` 控制宠物：

```bash
openclaw browser evaluate "petAPI.switchTo('naruto')"
openclaw browser evaluate "petAPI.rasengan()"
openclaw browser evaluate "petAPI.shadowClone()"
openclaw browser evaluate "petAPI.sageMode()"
openclaw browser evaluate "petAPI.say('dattebayo!')"
openclaw browser evaluate "petAPI.status()"
openclaw browser evaluate "petAPI.help()"
```
