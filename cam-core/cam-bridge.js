/**
 * CamBridge v2 — PixelOS 统一摄像头桥接层
 *
 * 核心原理：劫持 getUserMedia，返回由 pixel-os（小D之眼）喂帧的虚拟视频流
 * Skill 无需自己开摄像头，直接复用小D之眼的画面
 *
 * 数据流：小D之眼摄像头 → pixel-os → postMessage → cam-bridge → 虚拟canvas流 → Skill的video元素
 */
window.CamBridge = (function () {
  'use strict';

  // ============================================================
  // 虚拟摄像头：用 canvas 模拟一个 MediaStream
  // ============================================================
  const _canvas = document.createElement('canvas');
  _canvas.width = 320; _canvas.height = 240;
  const _ctx = _canvas.getContext('2d');

  // 初始画面：显示"连接小D之眼..."
  _ctx.fillStyle = '#0f380f';
  _ctx.fillRect(0, 0, 320, 240);
  _ctx.fillStyle = '#8bac0f';
  _ctx.font = '14px monospace';
  _ctx.textAlign = 'center';
  _ctx.fillText('👁 连接小D之眼...', 160, 120);

  // 创建虚拟视频流（canvas.captureStream）
  let _virtualStream = null;
  try {
    _virtualStream = _canvas.captureStream(10); // 10fps
  } catch (e) {
    console.warn('[CamBridge] captureStream 不可用，将回退到原始摄像头');
  }

  let _frameCount = 0;
  let _soulCommand = null;
  let _onSoulCommand = null;
  let _started = false;
  let _video = null;

  // ============================================================
  // 劫持 getUserMedia → 返回虚拟流（小D之眼共享）
  // ============================================================
  const _origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  if (_virtualStream) {
    navigator.mediaDevices.getUserMedia = async function (constraints) {
      if (constraints && constraints.video) {
        console.log('[CamBridge] getUserMedia 被劫持 → 返回小D之眼虚拟流');
        // 通知父页面开始发帧
        _postToParent({ type: 'skill_camera_started' });
        return _virtualStream;
      }
      // 非视频请求（如纯音频）走原始路径
      return _origGUM(constraints);
    };
  }

  // Hook srcObject setter：记录 video 元素
  const _origSetSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject');
  if (_origSetSrc && _origSetSrc.set) {
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      set: function (stream) {
        _origSetSrc.set.call(this, stream);
        if (this.tagName === 'VIDEO' && stream === _virtualStream) {
          _video = this;
          console.log('[CamBridge] video 元素已绑定虚拟流');
        }
      },
      get: _origSetSrc.get,
      configurable: true,
    });
  }

  // ============================================================
  // 接收父页面帧 → 画到虚拟 canvas 上
  // ============================================================
  const _tempImg = new Image();
  let _pendingFrame = null;

  _tempImg.onload = function () {
    _ctx.drawImage(_tempImg, 0, 0, 320, 240);
    _frameCount++;
    _pendingFrame = null;
  };

  function _drawFrame(base64) {
    if (_pendingFrame) return; // 上一帧还没画完
    _pendingFrame = true;
    _tempImg.src = 'data:image/jpeg;base64,' + base64;
  }

  // ============================================================
  // 监听来自 pixel-os（父页面）的消息
  // ============================================================
  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || typeof data !== 'object') return;

    // 摄像头帧：来自 pixel-os 的小D之眼
    if (data.type === 'camera_frame_for_skill' && data.frame) {
      _drawFrame(data.frame);
    }

    // soul 操作指令
    if (data.type === 'soul_request' || data.type === 'soul_draw') {
      _soulCommand = data;
      console.log('[CamBridge] 收到 soul 指令:', data.type, data.userRequest || '');
      if (_onSoulCommand) {
        _onSoulCommand(data);
      } else {
        _autoClickStart();
      }
    }

    // 直接请求帧
    if (data.type === 'request_frame') {
      _sendFrameToParent();
    }
  });

  // ============================================================
  // 自动启动：找到并点击 Skill 的启动按钮
  // ============================================================
  function _autoClickStart() {
    if (_started) return;
    _started = true;
    const patterns = [/开始/, /启动/, /START/i, /▶/, /开启/, /打开/, /检测/, /陪伴/, /连接/];
    const buttons = document.querySelectorAll('button, .btn, .action-btn, [onclick]');
    for (const btn of buttons) {
      const txt = (btn.textContent || '').trim();
      for (const pat of patterns) {
        if (pat.test(txt)) {
          console.log('[CamBridge] 自动点击:', txt.slice(0, 20));
          setTimeout(() => btn.click(), 300);
          return;
        }
      }
    }
  }

  // ============================================================
  // 向父页面发消息
  // ============================================================
  function _postToParent(msg) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, '*');
    }
  }

  function _sendFrameToParent() {
    try {
      const frame = _canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
      _postToParent({ type: 'skill_camera_frame', frame });
    } catch (e) {}
  }

  // ============================================================
  // 公开 API
  // ============================================================
  return {
    getSoulCommand() { return _soulCommand; },

    onSoulCommand(handler) {
      _onSoulCommand = handler;
      if (_soulCommand) handler(_soulCommand);
    },

    getCanvas() { return _canvas; },
    getContext() { return _ctx; },
    getVideo() { return _video; },
    getStream() { return _virtualStream; },
    getFrameCount() { return _frameCount; },

    /** 报告活动完成 → pixel-os 关闭 skill 回桌面 */
    reportDone(thoughts) {
      _postToParent({ type: 'app_event', event: 'activity_done', thoughts: thoughts || '' });
      console.log('[CamBridge] 活动完成:', thoughts);
    },

    /** 报告状态 */
    reportStatus(status) {
      _postToParent({ type: 'skill_status', status });
    },

    /** 发送帧给父页面 */
    sendFrame() { _sendFrameToParent(); },

    /** 获取原始 getUserMedia（绕过劫持） */
    getRealCamera(constraints) { return _origGUM(constraints); },
  };
})();
