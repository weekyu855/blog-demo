/**
 * 枫叶飘落效果（美化版） - Hexo Redefining 主题
 * 保存路径：themes/redefine/source/js/maple-leaf.js
 */
;(function () {
  'use strict'

  // ========== 配置项 ==========
  const CONFIG = {
    maxLeaves: 30,
    spawnInterval: 700,
    minSize: 16,
    maxSize: 32,
    fallSpeedMin: 0.35,
    fallSpeedMax: 1.1,
    windStrength: 0.25,
    swayAmplitude: 1.4,
    swayFrequency: 0.014,
    rotationSpeed: 0.018,
    colors: [
      '#B71C1C', '#C62828', '#D32F2F', '#E53935',
      '#BF360C', '#D84315', '#E64A19', '#F4511E',
      '#E65100', '#EF6C00', '#F57C00', '#FF8F00',
      '#FF6F00', '#FFA000', '#8D6E63', '#A1887F',
    ],
    opacityMin: 0.55,
    opacityMax: 0.95,
    zDepth: 0.45,
    shapeSamples: 72,     // 叶片轮廓采样点数
    veinDepth: 2,          // 叶脉分叉层级 (0=仅主脉)
  }

  // ========== Canvas 初始化 ==========
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)

  let W, H, dpr
  let leaves = []
  let animId = null
  let lastSpawn = 0
  let globalTime = 0

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  // ========== 工具函数 ==========

  // 确定性随机数生成器（同一 seed 每次调用结果相同）
  function seededRandom(seed) {
    let s = Math.abs(Math.floor(seed)) || 1
    return function () {
      s = (s * 16807) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    }
  }

  function rgbToHex(r, g, b) {
    const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
    return '#' + c(r) + c(g) + c(b)
  }

  function lighten(hex, pct) {
    const { r, g, b } = hexToRgb(hex)
    const a = 255 * pct / 100
    return rgbToHex(r + a, g + a, b + a)
  }

  function darken(hex, pct) {
    const { r, g, b } = hexToRgb(hex)
    const f = 1 - pct / 100
    return rgbToHex(r * f, g * f, b * f)
  }

  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex)
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
  }

  // ========== 枫叶形状生成（极坐标 + Catmull-Rom 平滑） ==========

  /**
   * 根据种子生成枫叶轮廓点集
   * 每片叶子因 seed 不同而有微妙形变
   */
  function generateMaplePoints(s, seed) {
    const rng = seededRandom(seed)
    const points = []
    const n = CONFIG.shapeSamples

    // 五个裂片的参数：角度(度)和相对长度
    // 顶部裂片最长，两侧递减，底部两个最短
    const lobes = [
      { deg: -90, len: 0.96 + rng() * 0.08 },
      { deg: -90 + 70, len: 0.70 + rng() * 0.06 },
      { deg: -90 + 140, len: 0.44 + rng() * 0.06 },
      { deg: -90 + 220, len: 0.44 + rng() * 0.06 },
      { deg: -90 + 290, len: 0.70 + rng() * 0.06 },
    ]

    // 每个裂片的角宽度（弧度），决定裂片的胖瘦
    const lobeWidths = lobes.map(() => (26 + rng() * 6) * Math.PI / 180)

    // 裂片尖端微偏移，让形状更自然
    const tipOffsets = lobes.map(() => ({
      dx: (rng() - 0.5) * s * 0.04,
      dy: (rng() - 0.5) * s * 0.04,
    }))

    // 锯齿参数（每片叶子不同）
    const sawFreq1 = 14 + rng() * 6
    const sawAmp1 = s * (0.008 + rng() * 0.006)
    const sawFreq2 = 7 + rng() * 4
    const sawAmp2 = s * (0.005 + rng() * 0.004)

    const baseR = s * (0.18 + rng() * 0.04) // 凹陷基础半径

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2
      let r = baseR

      // 叠加各裂片贡献
      for (let j = 0; j < lobes.length; j++) {
        const lobeRad = lobes[j].deg * Math.PI / 180
        let diff = angle - lobeRad
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2

        const hw = lobeWidths[j]
        if (Math.abs(diff) < hw) {
          const t = Math.abs(diff) / hw
          // 余弦钟形，指数控制裂片尖锐程度
          const sharpness = 1.3 + j * 0.05
          const smooth = Math.pow(Math.cos(t * Math.PI / 2), sharpness)
          r = Math.max(r, s * lobes[j].len * smooth)
        }
      }

      // 锯齿扰动
      r += Math.sin(angle * sawFreq1 + seed) * sawAmp1
      r += Math.sin(angle * sawFreq2 + seed * 0.7) * sawAmp2

      // 整体微扰
      r += Math.sin(angle * 3 + seed * 2.3) * s * 0.008

      r = Math.max(baseR * 0.6, r)

      points.push({
        x: Math.cos(angle) * r + tipOffsets[0].dx * 0.1, // 微偏移
        y: Math.sin(angle) * r + tipOffsets[0].dy * 0.1,
      })
    }

    // 在裂片尖端附近微调坐标，让尖端更尖
    for (let j = 0; j < lobes.length; j++) {
      const tipAngle = lobes[j].deg * Math.PI / 180
      const tipIdx = Math.round(((tipAngle + Math.PI / 2) / (Math.PI * 2)) * n) % n
      points[tipIdx].x += tipOffsets[j].dx
      points[tipIdx].y += tipOffsets[j].dy
      // 尖端附近稍微拉长
      for (let d = -1; d <= 1; d++) {
        const idx = (tipIdx + d + n) % n
        const pullFactor = d === 0 ? 0.08 : 0.03
        const dist = Math.sqrt(points[idx].x ** 2 + points[idx].y ** 2)
        if (dist > 0) {
          points[idx].x += (points[idx].x / dist) * s * pullFactor
          points[idx].y += (points[idx].y / dist) * s * pullFactor
        }
      }
    }

    return points
  }

  /**
   * 用 Catmull-Rom 样条绘制平滑闭合路径
   */
  function traceSmoothPath(ctx, pts) {
    const n = pts.length
    if (n < 3) return

    const tension = 0.28

    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % n]
      const p3 = pts[(i + 2) % n]

      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension

      if (i === 0) ctx.moveTo(p1.x, p1.y)
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
    ctx.closePath()
  }

  // ========== 叶脉系统 ==========

  /**
   * 绘制掌状叶脉（主脉 + 分叉侧脉）
   */
  function drawVeins(ctx, s, seed, color, opacity) {
    const rng = seededRandom(seed + 7777)

    // 叶脉基点（叶柄与叶片交界处）
    const bx = 0, by = s * 0.65

    // 五条主脉的终点（对应五个裂片方向）
    const tips = [
      { x: rng() * s * 0.03, y: -s * 0.88 },                          // 顶
      { x: s * 0.58 + rng() * s * 0.06, y: -s * 0.22 + rng() * s * 0.05 },  // 右上
      { x: s * 0.38 + rng() * s * 0.06, y: s * 0.38 + rng() * s * 0.04 },   // 右下
      { x: -s * 0.38 - rng() * s * 0.06, y: s * 0.38 + rng() * s * 0.04 },  // 左下
      { x: -s * 0.58 - rng() * s * 0.06, y: -s * 0.22 + rng() * s * 0.05 }, // 左上
    ]

    const veinColor = darken(color, 28)

    for (let v = 0; v < tips.length; v++) {
      const tip = tips[v]
      // 控制点让主脉有自然弧度
      const cpx = (bx + tip.x) / 2 + (rng() - 0.5) * s * 0.12
      const cpy = (by + tip.y) / 2 + (rng() - 0.5) * s * 0.06

      // 主脉（从粗到细，用渐变线宽模拟）
      drawTaperedCurve(ctx, bx, by, cpx, cpy, tip.x, tip.y,
        Math.max(0.5, s * 0.04), Math.max(0.3, s * 0.015),
        veinColor, opacity * 0.45)

      // 侧脉
      if (CONFIG.veinDepth >= 1) {
        const numBranches = 2 + Math.floor(rng() * 3)
        for (let b = 0; b < numBranches; b++) {
          const t = 0.2 + (b / numBranches) * 0.6
          // 二次贝塞尔曲线上的点
          const px = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cpx + t * t * tip.x
          const py = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cpy + t * t * tip.y

          // 切线方向
          const tx = 2 * (1 - t) * (cpx - bx) + 2 * t * (tip.x - cpx)
          const ty = 2 * (1 - t) * (cpy - by) + 2 * t * (tip.y - cpy)
          const tLen = Math.sqrt(tx * tx + ty * ty) || 1

          // 法线方向
          const nx = -ty / tLen
          const ny = tx / tLen

          const side = (b % 2 === 0) ? 1 : -1
          const branchLen = s * (0.08 + rng() * 0.1)
          const branchAngle = (0.35 + rng() * 0.35) * side

          // 侧脉终点：沿法线偏移 + 沿切线延伸
          const ex = px + nx * Math.sin(branchAngle) * branchLen + (tx / tLen) * Math.cos(branchAngle) * branchLen * 0.4
          const ey = py + ny * Math.sin(branchAngle) * branchLen + (ty / tLen) * Math.cos(branchAngle) * branchLen * 0.4

          drawTaperedCurve(ctx, px, py,
            (px + ex) / 2 + (rng() - 0.5) * s * 0.03,
            (py + ey) / 2 + (rng() - 0.5) * s * 0.03,
            ex, ey,
            Math.max(0.3, s * 0.02), Math.max(0.2, s * 0.006),
            veinColor, opacity * 0.3)

          // 第三级细脉
          if (CONFIG.veinDepth >= 2 && rng() > 0.4) {
            const t2 = 0.5 + rng() * 0.3
            const smx = px + (ex - px) * t2
            const smy = py + (ey - py) * t2
            const subLen = branchLen * (0.3 + rng() * 0.2)
            const subAngle = branchAngle + (rng() - 0.5) * 0.8
            const sex = smx + nx * Math.sin(subAngle) * subLen
            const sey = smy + ny * Math.sin(subAngle) * subLen

            ctx.strokeStyle = withAlpha(veinColor, opacity * 0.15)
            ctx.lineWidth = Math.max(0.2, s * 0.008)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(smx, smy)
            ctx.lineTo(sex, sey)
            ctx.stroke()
          }
        }
      }
    }
  }

  /**
   * 绘制从粗到细的曲线
   */
  function drawTaperedCurve(ctx, x0, y0, cpx, cpy, x1, y1, w0, w1, color, alpha) {
    const steps = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 0; i < steps; i++) {
      const t0 = i / steps
      const t1 = (i + 1) / steps

      const ax = (1 - t0) * (1 - t0) * x0 + 2 * (1 - t0) * t0 * cpx + t0 * t0 * x1
      const ay = (1 - t0) * (1 - t0) * y0 + 2 * (1 - t0) * t0 * cpy + t0 * t0 * y1
      const bx = (1 - t1) * (1 - t1) * x0 + 2 * (1 - t1) * t1 * cpx + t1 * t1 * x1
      const by = (1 - t1) * (1 - t1) * y0 + 2 * (1 - t1) * t1 * cpy + t1 * t1 * y1

      ctx.strokeStyle = withAlpha(color, alpha)
      ctx.lineWidth = w0 + (w1 - w0) * ((t0 + t1) / 2)
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()
    }
  }

  // ========== 叶柄绘制 ==========

  function drawStem(ctx, s, color, opacity) {
    const stemColor = darken(color, 40)
    ctx.lineCap = 'round'

    // 叶柄用两段贝塞尔曲线，略有弯曲
    const sx = 0, sy = s * 0.8
    const ex = s * 0.02, ey = s * 1.2
    const cpx = s * 0.06, cpy = s * 1.0

    // 粗到细
    const steps = 4
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps
      const t1 = (i + 1) / steps
      const ax = (1 - t0) * (1 - t0) * sx + 2 * (1 - t0) * t0 * cpx + t0 * t0 * ex
      const ay = (1 - t0) * (1 - t0) * sy + 2 * (1 - t0) * t0 * cpy + t0 * t0 * ey
      const bx = (1 - t1) * (1 - t1) * sx + 2 * (1 - t1) * t1 * cpx + t1 * t1 * ex
      const by = (1 - t1) * (1 - t1) * sy + 2 * (1 - t1) * t1 * cpy + t1 * t1 * ey

      ctx.strokeStyle = withAlpha(stemColor, opacity * 0.65)
      ctx.lineWidth = Math.max(0.5, s * 0.055 - (s * 0.04) * ((t0 + t1) / 2))
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()
    }
  }

  // ========== 完整单片叶子绘制 ==========

  function drawLeaf(ctx, leaf) {
    ctx.save()
    ctx.translate(leaf.x, leaf.y)
    ctx.rotate(leaf.rotation)
    ctx.scale(leaf.scaleX, leaf.scaleY)
    ctx.globalAlpha = leaf.opacity

    const s = leaf.size
    const pts = leaf.points // 预计算的轮廓点

    // ===== 第1层：柔和阴影 =====
    if (leaf.depth > 0.35) {
      ctx.save()
      ctx.shadowColor = 'rgba(30,10,5,0.09)'
      ctx.shadowBlur = s * 0.35
      ctx.shadowOffsetX = s * 0.06
      ctx.shadowOffsetY = s * 0.12
      traceSmoothPath(ctx, pts)
      ctx.fillStyle = 'rgba(0,0,0,0.01)'
      ctx.fill()
      ctx.restore()
    }

    // ===== 第2层：基础渐变填充 =====
    traceSmoothPath(ctx, pts)
    const baseGrad = ctx.createLinearGradient(-s * 0.2, -s, s * 0.15, s * 0.8)
    baseGrad.addColorStop(0, lighten(leaf.color, 22))
    baseGrad.addColorStop(0.35, leaf.color)
    baseGrad.addColorStop(0.7, darken(leaf.color, 8))
    baseGrad.addColorStop(1, darken(leaf.color, 22))
    ctx.fillStyle = baseGrad
    ctx.fill()

    // ===== 第3层：中心高光（模拟光照） =====
    traceSmoothPath(ctx, pts)
    ctx.save()
    ctx.clip()
    const hlGrad = ctx.createRadialGradient(
      -s * 0.12, -s * 0.35, 0,
      -s * 0.12, -s * 0.35, s * 0.65
    )
    hlGrad.addColorStop(0, 'rgba(255,255,240,0.28)')
    hlGrad.addColorStop(0.4, 'rgba(255,255,220,0.1)')
    hlGrad.addColorStop(1, 'rgba(255,255,200,0)')
    ctx.fillStyle = hlGrad
    ctx.fillRect(-s * 1.5, -s * 1.5, s * 3, s * 3)
    ctx.restore()

    // ===== 第4层：边缘暗角 =====
    traceSmoothPath(ctx, pts)
    ctx.save()
    ctx.clip()
    const edgeGrad = ctx.createRadialGradient(0, -s * 0.1, s * 0.15, 0, -s * 0.1, s * 1.05)
    edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
    edgeGrad.addColorStop(0.65, 'rgba(0,0,0,0)')
    edgeGrad.addColorStop(0.88, 'rgba(0,0,0,0.08)')
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0.16)')
    ctx.fillStyle = edgeGrad
    ctx.fillRect(-s * 1.5, -s * 1.5, s * 3, s * 3)
    ctx.restore()

    // ===== 第5层：色彩斑驳（模拟叶面不均匀） =====
    traceSmoothPath(ctx, pts)
    ctx.save()
    ctx.clip()
    const rng = seededRandom(leaf.seed + 3333)
    for (let i = 0; i < 4; i++) {
      const sx = (rng() - 0.5) * s * 1.2
      const sy = (rng() - 0.5) * s * 1.2
      const sr = s * (0.15 + rng() * 0.25)
      const patchGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
      const patchColor = rng() > 0.5 ? lighten(leaf.color, 8) : darken(leaf.color, 6)
      patchGrad.addColorStop(0, withAlpha(patchColor, 0.12))
      patchGrad.addColorStop(1, withAlpha(patchColor, 0))
      ctx.fillStyle = patchGrad
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2)
    }
    ctx.restore()

    // ===== 第6层：细边缘描边 =====
    traceSmoothPath(ctx, pts)
    ctx.strokeStyle = withAlpha(darken(leaf.color, 30), 0.2)
    ctx.lineWidth = Math.max(0.3, s * 0.018)
    ctx.stroke()

    // ===== 第7层：叶脉系统 =====
    drawVeins(ctx, s, leaf.seed, leaf.color, leaf.opacity)

    // ===== 第8层：叶柄 =====
    drawStem(ctx, s, leaf.color, leaf.opacity)

    ctx.restore()
  }

  // ========== 枫叶对象 ==========

  function createLeaf(forceY) {
    const depth = Math.random()
    const depthScale = 0.5 + depth * 0.5 * CONFIG.zDepth + (1 - CONFIG.zDepth) * 0.5
    const size = (CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize)) * depthScale
    const seed = Math.random() * 999999

    return {
      x: Math.random() * (W + 200) - 100,
      y: forceY !== undefined ? forceY : (-size * 2 - Math.random() * H * 0.3),
      size: size,
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      opacity: CONFIG.opacityMin + Math.random() * (CONFIG.opacityMax - CONFIG.opacityMin),
      depth: depth,
      seed: seed,
      points: generateMaplePoints(size, seed), // 预计算轮廓
      fallSpeed: (CONFIG.fallSpeedMin + Math.random() * (CONFIG.fallSpeedMax - CONFIG.fallSpeedMin)) * depthScale,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * CONFIG.rotationSpeed * 2,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: CONFIG.swayAmplitude * (0.5 + Math.random()) * depthScale,
      flipPhase: Math.random() * Math.PI * 2,
      flipSpeed: 0.008 + Math.random() * 0.018,
      scaleX: 1,
      scaleY: 1,
    }
  }

  // ========== 动画循环 ==========

  let windOffset = 0

  function update(timestamp) {
    globalTime = timestamp || 0

    // 缓变风力
    windOffset = Math.sin(globalTime * 0.00028) * CONFIG.windStrength
              + Math.sin(globalTime * 0.00063) * CONFIG.windStrength * 0.4
              + Math.sin(globalTime * 0.0011) * CONFIG.windStrength * 0.15

    // 生成
    if (globalTime - lastSpawn > CONFIG.spawnInterval && leaves.length < CONFIG.maxLeaves) {
      leaves.push(createLeaf())
      lastSpawn = globalTime
    }

    // 更新
    for (let i = leaves.length - 1; i >= 0; i--) {
      const lf = leaves[i]

      lf.y += lf.fallSpeed
      lf.swayPhase += CONFIG.swayFrequency
      lf.x += Math.sin(lf.swayPhase) * lf.swayAmp + windOffset * lf.depth
      lf.rotation += lf.rotationSpeed

      lf.flipPhase += lf.flipSpeed
      lf.scaleX = Math.cos(lf.flipPhase)
      lf.scaleY = 0.82 + Math.abs(Math.sin(lf.flipPhase)) * 0.18

      if (lf.y > H + lf.size * 2.5 || lf.x < -120 || lf.x > W + 120) {
        leaves.splice(i, 1)
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    leaves.sort((a, b) => a.depth - b.depth)
    for (const lf of leaves) drawLeaf(ctx, lf)
  }

  function loop(ts) {
    update(ts)
    render()
    animId = requestAnimationFrame(loop)
  }

  // ========== 启停控制 ==========

  function start() {
    if (animId) return
    for (let i = 0; i < 6; i++) leaves.push(createLeaf(Math.random() * H))
    animId = requestAnimationFrame(loop)
  }

  function stop() {
    if (animId) { cancelAnimationFrame(animId); animId = null }
    leaves = []
    ctx.clearRect(0, 0, W, H)
  }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start()
  })

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mq.matches) return
  mq.addEventListener('change', e => { e.matches ? stop() : start() })

  start()
})()
