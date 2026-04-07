/**
 * 枫叶飘落效果 - Hexo Redefining 主题
 * 将此文件保存为 themes/redefine/source/js/maple-leaf.js
 */
;(function () {
  'use strict'

  // ========== 配置项 ==========
  const CONFIG = {
    maxLeaves: 35,          // 同屏最大枫叶数量
    spawnInterval: 600,     // 生成间隔 (ms)
    minSize: 14,            // 最小尺寸
    maxSize: 30,            // 最大尺寸
    fallSpeedMin: 0.4,      // 最小下落速度
    fallSpeedMax: 1.2,      // 最大下落速度
    windStrength: 0.3,      // 风力强度
    swayAmplitude: 1.5,     // 左右摇摆幅度
    swayFrequency: 0.015,   // 摇摆频率
    rotationSpeed: 0.02,    // 旋转速度基数
    colors: [               // 枫叶颜色库
      '#C0392B', '#E74C3C', '#D35400', '#E67E22',
      '#F39C12', '#CB4335', '#A93226', '#DC7633',
      '#BA4A00', '#922B21', '#B03A2E', '#E59866'
    ],
    opacityMin: 0.6,        // 最小透明度
    opacityMax: 1.0,        // 最大透明度
    zDepth: 0.4,            // 纵深层次感 (0=扁平, 1=强纵深)
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
  let windOffset = 0

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

  // ========== 枫叶形状绘制 ==========
  // 绘制单片枫叶（以原点为中心，大小为 1，后续通过 scale 缩放）
  function drawMapleLeafShape(ctx, size) {
    const s = size
    ctx.beginPath()

    // 枫叶的五裂片路径 - 使用贝塞尔曲线构造自然形态
    // 从叶柄底部开始
    ctx.moveTo(0, s * 0.9)

    // 右下小裂片
    ctx.quadraticCurveTo(s * 0.15, s * 0.55, s * 0.45, s * 0.55)
    ctx.quadraticCurveTo(s * 0.3, s * 0.35, s * 0.5, s * 0.15)

    // 右上裂片（主裂片之一）
    ctx.quadraticCurveTo(s * 0.55, s * 0.05, s * 0.7, -s * 0.15)
    ctx.quadraticCurveTo(s * 0.6, -s * 0.05, s * 0.55, s * 0.05)

    // 右顶端裂片
    ctx.quadraticCurveTo(s * 0.5, -s * 0.25, s * 0.3, -s * 0.65)
    ctx.quadraticCurveTo(s * 0.25, -s * 0.5, s * 0.2, -s * 0.35)

    // 中心顶端
    ctx.quadraticCurveTo(s * 0.1, -s * 0.7, 0, -s * 0.95)
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.7, -s * 0.2, -s * 0.35)

    // 左顶端裂片
    ctx.quadraticCurveTo(-s * 0.25, -s * 0.5, -s * 0.3, -s * 0.65)
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.25, -s * 0.55, s * 0.05)

    // 左上裂片
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.05, -s * 0.7, -s * 0.15)
    ctx.quadraticCurveTo(-s * 0.55, s * 0.05, -s * 0.5, s * 0.15)

    // 左下小裂片
    ctx.quadraticCurveTo(-s * 0.3, s * 0.35, -s * 0.45, s * 0.55)
    ctx.quadraticCurveTo(-s * 0.15, s * 0.55, 0, s * 0.9)

    ctx.closePath()
  }

  // 绘制带叶脉的枫叶
  function drawLeaf(ctx, leaf) {
    ctx.save()
    ctx.translate(leaf.x, leaf.y)
    ctx.rotate(leaf.rotation)
    ctx.scale(leaf.scaleX, leaf.scaleY)  // 模拟3D翻转
    ctx.globalAlpha = leaf.opacity

    const s = leaf.size

    // 阴影（增强层次感）
    if (leaf.depth > 0.5) {
      ctx.shadowColor = 'rgba(0,0,0,0.08)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 3
    }

    // 叶片填充
    drawMapleLeafShape(ctx, s)

    // 渐变填充增加立体感
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s)
    grad.addColorStop(0, lightenColor(leaf.color, 25))
    grad.addColorStop(0.6, leaf.color)
    grad.addColorStop(1, darkenColor(leaf.color, 15))
    ctx.fillStyle = grad
    ctx.fill()

    // 清除阴影后画叶脉
    ctx.shadowColor = 'transparent'

    // 叶脉
    ctx.strokeStyle = darkenColor(leaf.color, 30)
    ctx.lineWidth = Math.max(0.5, s * 0.04)
    ctx.globalAlpha = leaf.opacity * 0.35

    // 主脉
    ctx.beginPath()
    ctx.moveTo(0, s * 0.85)
    ctx.lineTo(0, -s * 0.8)
    ctx.stroke()

    // 侧脉
    const veins = [
      [0, -s * 0.1, s * 0.45, -s * 0.5],
      [0, -s * 0.1, -s * 0.45, -s * 0.5],
      [0, -s * 0.3, s * 0.25, -s * 0.6],
      [0, -s * 0.3, -s * 0.25, -s * 0.6],
      [0, s * 0.1, s * 0.35, s * 0.05],
      [0, s * 0.1, -s * 0.35, s * 0.05],
    ]

    veins.forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - s * 0.05, x2, y2)
      ctx.stroke()
    })

    // 叶柄
    ctx.globalAlpha = leaf.opacity * 0.7
    ctx.strokeStyle = darkenColor(leaf.color, 40)
    ctx.lineWidth = Math.max(0.8, s * 0.06)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, s * 0.85)
    ctx.quadraticCurveTo(s * 0.02, s * 1.05, -s * 0.02, s * 1.15)
    ctx.stroke()

    ctx.restore()
  }

  // ========== 颜色工具函数 ==========
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  function rgbToHex(r, g, b) {
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)))
    return '#' + [r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')
  }

  function lightenColor(hex, percent) {
    const { r, g, b } = hexToRgb(hex)
    const amt = 255 * (percent / 100)
    return rgbToHex(r + amt, g + amt, b + amt)
  }

  function darkenColor(hex, percent) {
    const { r, g, b } = hexToRgb(hex)
    const factor = 1 - percent / 100
    return rgbToHex(r * factor, g * factor, b * factor)
  }

  // ========== 枫叶对象 ==========
  function createLeaf() {
    const depth = Math.random()  // 0=远 1=近
    const depthScale = 0.5 + depth * 0.5 * CONFIG.zDepth + (1 - CONFIG.zDepth) * 0.5
    const size = (CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize)) * depthScale

    return {
      x: Math.random() * (W + 200) - 100,
      y: -size * 2 - Math.random() * H * 0.3,
      size: size,
      color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
      opacity: CONFIG.opacityMin + Math.random() * (CONFIG.opacityMax - CONFIG.opacityMin),
      depth: depth,
      fallSpeed: (CONFIG.fallSpeedMin + Math.random() * (CONFIG.fallSpeedMax - CONFIG.fallSpeedMin)) * depthScale,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * CONFIG.rotationSpeed * 2,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: CONFIG.swayAmplitude * (0.5 + Math.random()) * depthScale,
      flipPhase: Math.random() * Math.PI * 2,
      flipSpeed: 0.01 + Math.random() * 0.02,
      scaleX: 1,
      scaleY: 1,
      alive: true,
    }
  }

  // ========== 动画循环 ==========
  function update(timestamp) {
    globalTime = timestamp || 0

    // 风力模拟：缓慢变化的正弦风
    windOffset = Math.sin(globalTime * 0.0003) * CONFIG.windStrength
              + Math.sin(globalTime * 0.0007) * CONFIG.windStrength * 0.5

    // 生成新枫叶
    if (globalTime - lastSpawn > CONFIG.spawnInterval && leaves.length < CONFIG.maxLeaves) {
      leaves.push(createLeaf())
      lastSpawn = globalTime
    }

    // 更新每片叶子
    for (let i = leaves.length - 1; i >= 0; i--) {
      const leaf = leaves[i]

      // 下落
      leaf.y += leaf.fallSpeed

      // 左右摇摆
      leaf.swayPhase += CONFIG.swayFrequency
      leaf.x += Math.sin(leaf.swayPhase) * leaf.swayAmp + windOffset * leaf.depth

      // 旋转
      leaf.rotation += leaf.rotationSpeed

      // 3D翻转效果（模拟叶片在空中翻转）
      leaf.flipPhase += leaf.flipSpeed
      leaf.scaleX = Math.cos(leaf.flipPhase)
      leaf.scaleY = 0.85 + Math.abs(Math.sin(leaf.flipPhase)) * 0.15

      // 超出屏幕移除
      if (leaf.y > H + leaf.size * 2 || leaf.x < -100 || leaf.x > W + 100) {
        leaves.splice(i, 1)
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)

    // 按深度排序：远处先画（被近处遮挡）
    leaves.sort((a, b) => a.depth - b.depth)

    for (const leaf of leaves) {
      drawLeaf(ctx, leaf)
    }
  }

  function loop(timestamp) {
    update(timestamp)
    render()
    animId = requestAnimationFrame(loop)
  }

  // ========== 启动与销毁 ==========
  function start() {
    if (animId) return
    // 预生成几片叶子，避免开场空白
    for (let i = 0; i < 8; i++) {
      const leaf = createLeaf()
      leaf.y = Math.random() * H
      leaves.push(leaf)
    }
    animId = requestAnimationFrame(loop)
  }

  function stop() {
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
    leaves = []
    ctx.clearRect(0, 0, W, H)
  }

  // 页面可见性控制，切后台暂停节省性能
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  })

  // 尊重减弱动画偏好
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (motionQuery.matches) return
  motionQuery.addEventListener('change', (e) => {
    if (e.matches) stop()
    else start()
  })

  start()
})()
