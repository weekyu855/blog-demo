/**
 * 枫叶飘落特效 —— 适配 Hexo Redefine 主题
 * 纯原生 Canvas，无依赖，不污染全局变量
 */
;(function () {
  'use strict';

  /* ========== 可配置参数 ========== */
  var CONFIG = {
    count: 30,        // 枫叶数量
    size: 26,         // 枫叶基础大小 (px)
    speed: 3,         // 下落速度倍率 (1-10)
    wind: 1.0,        // 风力 (-5.0 到 5.0，正=向右)
    zIndex: 9999      // canvas 层级，确保在博客内容之上
  };

  /* 尊重用户减少动效偏好 */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ========== 画布初始化 ========== */
  var canvas = document.createElement('canvas');
  canvas.id = 'maple-leaves-canvas';
  canvas.style.cssText =
    'position:fixed!important;top:0!important;left:0!important;' +
    'width:100%!important;height:100%!important;' +
    'pointer-events:none!important;z-index:' + CONFIG.zIndex + '!important;';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;
  var leaves = [];
  var running = true;
  var mouseX = -9999, mouseY = -9999;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ========== 鼠标跟踪（可选排斥效果）========== */
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.addEventListener('mouseleave', function () {
    mouseX = -9999;
    mouseY = -9999;
  });

  /* ========== 颜色工具 ========== */
  function hexRgb(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16)
    ];
  }
  function darker(hex, n) {
    var c = hexRgb(hex);
    return 'rgb(' + Math.max(0, c[0] - n) + ',' + Math.max(0, c[1] - n) + ',' + Math.max(0, c[2] - n) + ')';
  }
  function lighter(hex, n) {
    var c = hexRgb(hex);
    return 'rgb(' + Math.min(255, c[0] + n) + ',' + Math.min(255, c[1] + n) + ',' + Math.min(255, c[2] + n) + ')';
  }

  /* ========== 枫叶颜色库 ========== */
  var COLORS = [
    '#8B1A1A', '#9B2335', '#A52A2A', '#B22222', '#C0392B',
    '#CD3333', '#CC4444', '#D35400', '#E67E22', '#D2691E',
    '#CD6839', '#B8601A', '#C97D1A', '#DAA520', '#CC7722',
    '#9B3A12', '#A0522D'
  ];

  /* ========== 绘制单片枫叶 ========== */
  function drawLeaf(s, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    /* 径向渐变填充 */
    var grad = ctx.createRadialGradient(0, -s * 0.1, 0, 0, 0, s * 0.82);
    grad.addColorStop(0, lighter(color, 38));
    grad.addColorStop(0.55, color);
    grad.addColorStop(1, darker(color, 28));
    ctx.fillStyle = grad;

    /* 五裂枫叶轮廓 —— 10 段三次贝塞尔曲线 */
    ctx.beginPath();
    ctx.moveTo(0, s * 0.55);

    // 右下裂片
    ctx.bezierCurveTo(s * 0.08, s * 0.38, s * 0.28, s * 0.36, s * 0.48, s * 0.18);
    ctx.bezierCurveTo(s * 0.40, s * 0.28, s * 0.26, s * 0.18, s * 0.22, s * 0.06);
    // 右上裂片
    ctx.bezierCurveTo(s * 0.34, s * 0.02, s * 0.52, -s * 0.04, s * 0.56, -s * 0.26);
    ctx.bezierCurveTo(s * 0.44, -s * 0.16, s * 0.28, -s * 0.16, s * 0.16, -s * 0.22);
    // 顶部主裂片（右弧）
    ctx.bezierCurveTo(s * 0.22, -s * 0.46, s * 0.12, -s * 0.68, 0, -s * 0.78);
    // 顶部主裂片（左弧）
    ctx.bezierCurveTo(-s * 0.12, -s * 0.68, -s * 0.22, -s * 0.46, -s * 0.16, -s * 0.22);
    // 左上裂片
    ctx.bezierCurveTo(-s * 0.28, -s * 0.16, -s * 0.44, -s * 0.16, -s * 0.56, -s * 0.26);
    ctx.bezierCurveTo(-s * 0.52, -s * 0.04, -s * 0.34, s * 0.02, -s * 0.22, s * 0.06);
    // 左下裂片
    ctx.bezierCurveTo(-s * 0.26, s * 0.18, -s * 0.40, s * 0.28, -s * 0.48, s * 0.18);
    ctx.bezierCurveTo(-s * 0.28, s * 0.36, -s * 0.08, s * 0.38, 0, s * 0.55);
    ctx.closePath();
    ctx.fill();

    /* 边缘描线 */
    ctx.strokeStyle = darker(color, 42);
    ctx.lineWidth = Math.max(0.4, s * 0.022);
    ctx.stroke();

    /* ---- 叶脉 ---- */
    ctx.strokeStyle = darker(color, 55);
    ctx.lineWidth = Math.max(0.3, s * 0.018);
    ctx.globalAlpha = alpha * 0.38;

    // 中脉
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(0, -s * 0.65);
    ctx.stroke();

    // 四条主侧脉
    var veins = [
      [0, s * 0.05, s * 0.22, s * 0.02, s * 0.42, s * 0.14],
      [0, -s * 0.12, s * 0.22, -s * 0.12, s * 0.48, -s * 0.2],
      [0, s * 0.05, -s * 0.22, s * 0.02, -s * 0.42, s * 0.14],
      [0, -s * 0.12, -s * 0.22, -s * 0.12, -s * 0.48, -s * 0.2]
    ];
    for (var i = 0; i < veins.length; i++) {
      var v = veins[i];
      ctx.beginPath();
      ctx.moveTo(v[0], v[1]);
      ctx.quadraticCurveTo(v[2], v[3], v[4], v[5]);
      ctx.stroke();
    }

    // 顶部小侧脉
    ctx.globalAlpha = alpha * 0.22;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.35); ctx.lineTo(s * 0.08, -s * 0.58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s * 0.35); ctx.lineTo(-s * 0.08, -s * 0.58); ctx.stroke();

    /* ---- 叶柄 ---- */
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = darker(color, 62);
    ctx.lineWidth = Math.max(0.8, s * 0.04);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.55);
    ctx.quadraticCurveTo(s * 0.015, s * 0.72, -s * 0.04, s * 0.95);
    ctx.stroke();

    ctx.restore();
  }

  /* ========== 创建单片枫叶 ========== */
  function createLeaf(startTop) {
    var sizeMul = 0.5 + Math.random() * 0.95;
    return {
      x: Math.random() * W,
      y: startTop ? -(CONFIG.size * 2 + Math.random() * 150) : Math.random() * H,
      s: CONFIG.size * sizeMul,
      vy: (0.35 + Math.random() * 1.7) * (CONFIG.speed / 3),
      vx: 0,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.03,
      swayPh: Math.random() * Math.PI * 2,
      swayAmp: 0.4 + Math.random() * 1.8,
      swaySpd: 0.007 + Math.random() * 0.02,
      flipPh: Math.random() * Math.PI * 2,
      flipSpd: 0.004 + Math.random() * 0.015,
      wobPh: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.42 + Math.random() * 0.52,
      depth: Math.random()
    };
  }

  /* ========== 初始化 ========== */
  function init() {
    leaves = [];
    for (var i = 0; i < CONFIG.count; i++) {
      leaves.push(createLeaf(false));
    }
  }

  function syncCount() {
    while (leaves.length < CONFIG.count) leaves.push(createLeaf(true));
    while (leaves.length > CONFIG.count) leaves.pop();
  }

  /* ========== 更新 ========== */
  function update(lf) {
    lf.swayPh += lf.swaySpd;
    lf.wobPh += 0.008;
    var sway = Math.sin(lf.swayPh) * lf.swayAmp;
    lf.vx = sway + CONFIG.wind * 0.45 + Math.sin(lf.wobPh) * 0.22;

    // 鼠标排斥（130px 范围内）
    var dx = lf.x - mouseX;
    var dy = lf.y - mouseY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 130 && dist > 0.1) {
      var f = (130 - dist) / 130 * 1.6;
      lf.vx += (dx / dist) * f;
      lf.y += (dy / dist) * f * 0.35;
    }

    lf.x += lf.vx;
    lf.y += lf.vy;
    lf.rot += lf.rotV + Math.sin(lf.swayPh) * 0.007;
    lf.flipPh += lf.flipSpd;

    // 超出边界重置到顶部
    if (lf.y > H + lf.s * 2) {
      lf.y = -lf.s * 2 - Math.random() * 80;
      lf.x = Math.random() * W;
    }
    if (lf.x > W + lf.s * 2) lf.x = -lf.s * 2;
    if (lf.x < -lf.s * 2) lf.x = W + lf.s * 2;
  }

  /* ========== 渲染 ========== */
  function render(lf) {
    ctx.save();
    ctx.translate(lf.x, lf.y);
    ctx.rotate(lf.rot);
    // 水平缩放模拟 3D 翻转
    ctx.scale(Math.cos(lf.flipPh), 1);
    // 景深影响
    var ds = 0.65 + lf.depth * 0.35;
    var da = 0.45 + lf.depth * 0.55;
    ctx.scale(ds, ds);
    drawLeaf(lf.s, lf.color, lf.alpha * da);
    ctx.restore();
  }

  /* ========== 主循环 ========== */
  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < leaves.length; i++) {
      update(leaves[i]);
      render(leaves[i]);
    }
    requestAnimationFrame(loop);
  }

  init();
  loop();

  /* ========== 页面不可见时暂停，节省性能 ========== */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      loop();
    }
  });

})();
