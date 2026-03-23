/**
 * CamCore - PixelOS 通用摄像头算法模块
 * 所有摄像头 Skill 共享的底层视觉算法
 *
 * 提供: 光线归一化, Box Blur, HSV肤色检测, 自适应背景建模,
 *       连通区域分析, 时间平滑状态机, Sobel边缘检测, HSL色彩转换
 */
window.CamCore = (function() {
  'use strict';

  // ============================================================
  // 1. 光线归一化 (Gray World Assumption)
  //    让 RGB 三通道均值对齐，消除色温偏移
  // ============================================================
  function normalize(imageData) {
    const d = imageData.data, len = d.length;
    let sumR = 0, sumG = 0, sumB = 0, count = len / 4;
    for (let i = 0; i < len; i += 4) {
      sumR += d[i]; sumG += d[i+1]; sumB += d[i+2];
    }
    const avgR = sumR / count, avgG = sumG / count, avgB = sumB / count;
    if (avgR < 1 || avgG < 1 || avgB < 1) return imageData; // 全黑保护
    const avg = (avgR + avgG + avgB) / 3;
    const sR = avg / avgR, sG = avg / avgG, sB = avg / avgB;
    for (let i = 0; i < len; i += 4) {
      d[i]   = Math.min(255, d[i]   * sR + 0.5) | 0;
      d[i+1] = Math.min(255, d[i+1] * sG + 0.5) | 0;
      d[i+2] = Math.min(255, d[i+2] * sB + 0.5) | 0;
    }
    return imageData;
  }

  // ============================================================
  // 2. 快速 Box Blur (可分离两遍，水平+垂直)
  //    radius=1 → 3x3, radius=2 → 5x5
  // ============================================================
  function boxBlur(imageData, w, h, radius) {
    if (radius < 1) return imageData;
    const d = imageData.data;
    const tmp = new Uint8ClampedArray(d.length);
    const diam = radius * 2 + 1;
    const invD = 1 / diam;
    // Horizontal pass
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        // 初始化窗口
        for (let dx = -radius; dx <= radius; dx++) {
          const x = Math.max(0, Math.min(w - 1, dx));
          sum += d[(y * w + x) * 4 + c];
        }
        for (let x = 0; x < w; x++) {
          tmp[(y * w + x) * 4 + c] = (sum * invD + 0.5) | 0;
          const xr = Math.min(w - 1, x + radius + 1);
          const xl = Math.max(0, x - radius);
          sum += d[(y * w + xr) * 4 + c] - d[(y * w + xl) * 4 + c];
        }
      }
      // Copy alpha
      for (let x = 0; x < w; x++) tmp[(y * w + x) * 4 + 3] = 255;
    }
    // Vertical pass
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const y = Math.max(0, Math.min(h - 1, dy));
          sum += tmp[(y * w + x) * 4 + c];
        }
        for (let y = 0; y < h; y++) {
          d[(y * w + x) * 4 + c] = (sum * invD + 0.5) | 0;
          const yb = Math.min(h - 1, y + radius + 1);
          const yt = Math.max(0, y - radius);
          sum += tmp[(yb * w + x) * 4 + c] - tmp[(yt * w + x) * 4 + c];
        }
      }
    }
    return imageData;
  }

  // ============================================================
  // 3. 色彩空间转换
  // ============================================================
  function rgb2hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (d > 0) {
      if (max === r)      h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else                h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, v * 100];
  }

  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r)      h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else                h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }

  function hsl2rgb(h, s, l) {
    if (s === 0) { const v = (l * 255) | 0; return [v, v, v]; }
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60)       { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else              { r = c; b = x; }
    return [((r + m) * 255 + 0.5) | 0, ((g + m) * 255 + 0.5) | 0, ((b + m) * 255 + 0.5) | 0];
  }

  // ============================================================
  // 4. HSV 肤色检测 (替代 RGB 硬编码)
  //    在 HSV 空间中检测，对光线变化更鲁棒
  //    支持 ROI 区域限定
  // ============================================================
  function detectSkin(imageData, w, h, roi) {
    const d = imageData.data;
    const x0 = roi ? roi.x : 0;
    const y0 = roi ? roi.y : 0;
    const x1 = roi ? Math.min(w, roi.x + roi.w) : w;
    const y1 = roi ? Math.min(h, roi.y + roi.h) : h;
    let skinPx = 0, total = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        const r = d[i], g = d[i+1], b = d[i+2];
        const hsv = rgb2hsv(r, g, b);
        // 宽泛肤色范围: H 0°~55°, S 15%~75%, V 20%+
        // 同时保留 RGB 辅助条件: R > G (排除绿色系)
        if (hsv[0] >= 0 && hsv[0] <= 55 &&
            hsv[1] >= 12 && hsv[1] <= 75 &&
            hsv[2] >= 18 && r > g) {
          skinPx++;
        }
        total++;
      }
    }
    return total > 0 ? (skinPx / total * 100) : 0;
  }

  // ============================================================
  // 5. 自适应背景建模 (指数移动平均)
  //    替代简单帧差，大幅减少光线渐变导致的误报
  // ============================================================
  class BackgroundModel {
    constructor(alpha = 0.02) {
      this.alpha = alpha;
      this.bg = null;
      this.ready = false;
      this.frameCount = 0;
    }

    // 更新背景模型并返回差异
    // Returns: { pct: 变化百分比, map: Uint8Array二值图(0/255), blurred: 是否已预处理 }
    update(imageData, w, h, diffThreshold = 25) {
      const d = imageData.data;
      const len = d.length;

      if (!this.bg) {
        this.bg = new Float32Array(len);
        for (let i = 0; i < len; i++) this.bg[i] = d[i];
        this.ready = true;
        this.frameCount = 1;
        return { pct: 0, map: null };
      }

      this.frameCount++;
      // 前30帧用较快的学习率让背景稳定
      const a = this.frameCount < 30 ? 0.1 : this.alpha;

      const map = new Uint8Array(w * h);
      let diffCount = 0;
      const total = w * h;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const dr = Math.abs(d[i]   - this.bg[i]);
          const dg = Math.abs(d[i+1] - this.bg[i+1]);
          const db = Math.abs(d[i+2] - this.bg[i+2]);
          const diff = (dr + dg + db) / 3;

          if (diff > diffThreshold) {
            map[y * w + x] = 255;
            diffCount++;
            // 变化区域不更新背景 (只更新静止区域)
          } else {
            this.bg[i]   = this.bg[i]   * (1 - a) + d[i]   * a;
            this.bg[i+1] = this.bg[i+1] * (1 - a) + d[i+1] * a;
            this.bg[i+2] = this.bg[i+2] * (1 - a) + d[i+2] * a;
          }
        }
      }

      return { pct: diffCount / total * 100, map: map };
    }

    // 强制重置背景 (用户点击"设置背景"时调用)
    reset(imageData) {
      if (!imageData) { this.bg = null; this.ready = false; return; }
      const d = imageData.data;
      this.bg = new Float32Array(d.length);
      for (let i = 0; i < d.length; i++) this.bg[i] = d[i];
      this.ready = true;
      this.frameCount = 30; // 跳过快速学习阶段
    }
  }

  // ============================================================
  // 6. 连通区域分析 (Blob Detection)
  //    在二值图上找连通区域，返回面积、位置、包围盒
  // ============================================================
  function findBlobs(map, w, h, minArea) {
    minArea = minArea || 20;
    const visited = new Uint8Array(w * h);
    const blobs = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (map[y * w + x] === 0 || visited[y * w + x]) continue;

        // BFS flood fill
        let area = 0, sumX = 0, sumY = 0;
        let minX = x, maxX = x, minY = y, maxY = y;
        const queue = [[x, y]];
        visited[y * w + x] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.shift();
          area++; sumX += cx; sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-连通
          const neighbors = [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h &&
                !visited[ny * w + nx] && map[ny * w + nx]) {
              visited[ny * w + nx] = 1;
              queue.push([nx, ny]);
            }
          }
        }

        if (area >= minArea) {
          blobs.push({
            x: minX, y: minY,
            w: maxX - minX + 1, h: maxY - minY + 1,
            area: area,
            cx: (sumX / area) | 0,
            cy: (sumY / area) | 0
          });
        }
      }
    }

    // 按面积降序排列
    blobs.sort((a, b) => b.area - a.area);
    return blobs;
  }

  // ============================================================
  // 7. 时间平滑状态机 (Temporal State Filter)
  //    防止单帧闪烁，需要连续多帧确认才切换状态
  // ============================================================
  class StateFilter {
    constructor(windowSize, onThreshold, offThreshold) {
      this.size = windowSize || 10;
      this.onThresh = onThreshold || 0.6;
      this.offThresh = offThreshold || 0.3;
      this.window = new Array(this.size).fill(false);
      this.idx = 0;
      this.state = false;
    }

    update(detected) {
      this.window[this.idx] = !!detected;
      this.idx = (this.idx + 1) % this.size;
      const count = this.window.filter(Boolean).length;
      const ratio = count / this.size;
      if (!this.state && ratio >= this.onThresh) this.state = true;
      else if (this.state && ratio <= this.offThresh) this.state = false;
      return this.state;
    }

    reset(state) {
      this.state = !!state;
      this.window.fill(this.state);
    }
  }

  // ============================================================
  // 8. Sobel 边缘检测
  //    返回 Uint8Array 灰度边缘图
  // ============================================================
  function sobelEdge(imageData, w, h) {
    const d = imageData.data;
    // 先转灰度
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    }
    const edge = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx =
          -gray[(y-1)*w+(x-1)] + gray[(y-1)*w+(x+1)]
          -2*gray[y*w+(x-1)]   + 2*gray[y*w+(x+1)]
          -gray[(y+1)*w+(x-1)] + gray[(y+1)*w+(x+1)];
        const gy =
          -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)]
          +gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)];
        edge[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy) + 0.5) | 0;
      }
    }
    return edge;
  }

  // ============================================================
  // 9. 灰度数组
  // ============================================================
  function grayArray(imageData, w, h) {
    const d = imageData.data;
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      g[i] = d[i*4] * 0.299 + d[i*4+1] * 0.587 + d[i*4+2] * 0.114;
    }
    return g;
  }

  // ============================================================
  // 10. 亮度分析
  //     返回 { avg, min, max, histogram[256] }
  // ============================================================
  function analyzeBrightness(imageData, w, h, roi) {
    const d = imageData.data;
    const x0 = roi ? roi.x : 0;
    const y0 = roi ? roi.y : 0;
    const x1 = roi ? Math.min(w, roi.x + roi.w) : w;
    const y1 = roi ? Math.min(h, roi.y + roi.h) : h;
    let sum = 0, min = 255, max = 0, count = 0;
    const hist = new Uint32Array(256);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4;
        const lum = (d[i] * 299 + d[i+1] * 587 + d[i+2] * 114) / 1000 | 0;
        sum += lum; count++;
        if (lum < min) min = lum;
        if (lum > max) max = lum;
        hist[lum]++;
      }
    }
    return { avg: count ? sum / count : 0, min, max, histogram: hist, count };
  }

  // ============================================================
  // 11. 简单运动检测 (帧差法，用于不需要背景建模的场景)
  //     比原来的改进: 先 blur 去噪 + 返回 binary map
  // ============================================================
  function frameDiff(cur, prev, w, h, threshold) {
    threshold = threshold || 25;
    const cd = cur.data, pd = prev.data;
    const map = new Uint8Array(w * h);
    let diffCount = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dr = Math.abs(cd[i] - pd[i]);
        const dg = Math.abs(cd[i+1] - pd[i+1]);
        const db = Math.abs(cd[i+2] - pd[i+2]);
        if ((dr + dg + db) / 3 > threshold) {
          map[y * w + x] = 255;
          diffCount++;
        }
      }
    }
    return { pct: diffCount / (w * h) * 100, map };
  }

  // ============================================================
  // 12. 摄像头初始化辅助
  // ============================================================
  async function initCamera(videoEl, opts) {
    opts = opts || {};
    const facingMode = opts.facing || 'user';
    const width = opts.width || 640;
    const height = opts.height || 480;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: width }, height: { ideal: height } },
        audio: false
      });
      videoEl.srcObject = stream;
      videoEl.setAttribute('playsinline', '');
      videoEl.muted = true;
      await videoEl.play();
      return stream;
    } catch(e) {
      console.error('Camera init failed:', e);
      return null;
    }
  }

  // ============================================================
  // 13. 获取降采样帧 (统一的帧获取)
  // ============================================================
  function getFrame(video, canvas, ctx, w, h) {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }

  // ============================================================
  // Public API
  // ============================================================
  return {
    // 预处理
    normalize,
    boxBlur,
    // 色彩
    rgb2hsv,
    rgb2hsl,
    hsl2rgb,
    // 检测
    detectSkin,
    analyzeBrightness,
    frameDiff,
    sobelEdge,
    grayArray,
    findBlobs,
    // 类
    BackgroundModel,
    StateFilter,
    // 辅助
    initCamera,
    getFrame
  };
})();
