(function () {
  'use strict';

  /* ---------- 配置参数 ---------- */
  var CONFIG = {
    count: 55,
    minSize: 10,
    maxSize: 32,
    minSpeed: 0.4,
    maxSpeed: 2.0,
    wind: 0.6,
    windVariant: 0.8,
    swing: 1.8,
    swingSpeed: 0.012,
    flipSpeed: 0.025,
    rotationSpeed: 0.015,
    mouseRadius: 120,
    mouseForce: 1.2,
    depthLayers: 3,
    colors: [
      '#c0392b', '#d4451a', '#b7410e',
      '#e67e22', '#d35400',
      '#f39c12', '#e8a317',
      '#a0522d', '#8b4513',
      '#cc5500', '#bf4f00'
    ]
  };

  var canvas, ctx, W, H, dpr;
  var leaves = [];
  var mouse = { x: -9999, y: -9999 };
  var globalTime = 0;
  var animId = null;
  var resizeTimer = null;

  /* ---------- 事件处理函数（提出来防止重复绑定） ---------- */
  var onResize = function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initLeaves();
    }, 300);
  };

  var onMouseMove = function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };

  var onMouseLeave = function () {
    mouse.x = -9999;
    mouse.y = -9999;
  };

  /* ---------- 工具函数 ---------- */
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- 枫叶绘制 ---------- */
  function maplePath(c, s) {
    c.beginPath();
    c.moveTo(0, s * 0.9);
    c.quadraticCurveTo(s * 0.15, s * 0.55, s * 0.5, s * 0.5);
    c.quadraticCurveTo(s * 0.35, s * 0.35, s * 0.65, s * 0.1);
    c.quadraticCurveTo(s * 0.45, s * 0.15, s * 0.55, -s * 0.2);
    c.quadraticCurveTo(s * 0.4, -s * 0.1, s * 0.35, -s * 0.45);
    c.quadraticCurveTo(s * 0.2, -s * 0.3, 0, -s * 0.85);
    c.quadraticCurveTo(-s * 0.2, -s * 0.3, -s * 0.35, -s * 0.45);
    c.quadraticCurveTo(-s * 0.4, -s * 0.1, -s * 0.55, -s * 0.2);
    c.quadraticCurveTo(-s * 0.45, s * 0.15, -s * 0.65, s * 0.1);
    c.quadraticCurveTo(-s * 0.35, s * 0.35, -s * 0.5, s * 0.5);
    c.quadraticCurveTo(-s * 0.15, s * 0.55, 0, s * 0.9);
    c.closePath();
  }

  function drawVeins(c, s) {
    c.save();
    c.strokeStyle = 'rgba(0,0,0,0.15)';
    c.lineWidth = Math.max(0.4, s * 0.025);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, s * 0.85);
    c.lineTo(0, -s * 0.75);
    c.stroke();
    var vp = [
      [0.4, -0.45, 0.15, 0.45, 0.15],
      [0.05, -0.55, -0.05, 0.55, -0.05],
      [-0.2, -0.4, -0.35, 0.4, -0.35],
      [-0.45, -0.25, -0.55, 0.25, -0.55],
      [-0.65, -0.1, -0.75, 0.1, -0.75]
    ];
    for (var v = 0; v < vp.length; v++) {
      var r = vp[v];
      c.beginPath();
      c.moveTo(0, s * r[0]);
      c.quadraticCurveTo(s * r[3] * 0.5, s * (r[0] + r[4]) * 0.5, s * r[3], s * r[4]);
      c.stroke();
      c.beginPath();
      c.moveTo(0, s * r[0]);
      c.quadraticCurveTo(s * r[1] * 0.5, s * (r[0] + r[2]) * 0.5, s * r[1], s * r[2]);
      c.stroke();
    }
    c.restore();
  }

  function drawLeaf(x, y, size, rot, flipX, flipY, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(flipX, flipY);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(0.8, size * 0.06);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.9);
    ctx.lineTo(0, size * 1.3);
    ctx.stroke();
    maplePath(ctx, size);
    ctx.fillStyle = color;
    ctx.fill();
    maplePath(ctx, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = Math.max(0.3, size * 0.02);
    ctx.stroke();
    drawVeins(ctx, size);
    ctx.save();
    ctx.globalAlpha = alpha * 0.2;
    ctx.beginPath();
    ctx.ellipse(-size * 0.15, -size * 0.25, size * 0.2, size * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ---------- 枫叶对象 ---------- */
  function createLeaf(layer) {
    var df = layer / CONFIG.depthLayers;
    var sz = lerp(CONFIG.minSize, CONFIG.maxSize, df * df);
    var sp = lerp(CONFIG.minSpeed, CONFIG.maxSpeed, df);
    var op = lerp(0.45, 1.0, df);
    var col = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    return {
      x: rand(-60, W + 60), y: rand(-H * 0.6, -20),
      size: rand(sz * 0.75, sz), speed: rand(sp * 0.7, sp),
      opacity: rand(op * 0.8, op), color: col,
      layer: layer, depthFactor: df,
      swingPhase: rand(0, Math.PI * 2),
      swingAmp: rand(CONFIG.swing * 0.3, CONFIG.swing) * (0.4 + df * 0.6),
      swingFreq: rand(CONFIG.swingSpeed * 0.7, CONFIG.swingSpeed * 1.3),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-CONFIG.rotationSpeed, CONFIG.rotationSpeed) * (0.5 + df * 0.5),
      flipPhase: rand(0, Math.PI * 2),
      flipFreq: rand(CONFIG.flipSpeed * 0.6, CONFIG.flipSpeed * 1.5),
      windOffset: rand(-CONFIG.windVariant, CONFIG.windVariant),
      gustTimer: rand(0, 500), gustCooldown: rand(300, 800),
      gustDx: 0, gustDy: 0
    };
  }

  function initLeaves() {
    leaves = [];
    var cnt = Math.floor(CONFIG.count * Math.max(1, W * H / (1920 * 1080)));
    for (var i = 0; i < cnt; i++) {
      var ly = Math.floor(rand(0, CONFIG.depthLayers)) + 1;
      var lf = createLeaf(ly);
      lf.y = rand(-60, H + 60);
      leaves.push(lf);
    }
  }

  /* ---------- 动画循环 ---------- */
  function update() {
    globalTime++;
    for (var i = 0; i < leaves.length; i++) {
      var lf = leaves[i];
      lf.y += lf.speed;
      lf.swingPhase += lf.swingFreq;
      var sx = Math.sin(lf.swingPhase) * lf.swingAmp;
      var wn = CONFIG.wind + lf.windOffset + Math.sin(globalTime * 0.0015 + lf.swingPhase) * 0.25;
      lf.x += sx + wn * lf.depthFactor;
      lf.rotation += lf.rotSpeed;
      lf.flipPhase += lf.flipFreq;
      lf.gustTimer++;
      if (lf.gustTimer > lf.gustCooldown) {
        lf.gustDx = rand(-3, 3); lf.gustDy = rand(-0.5, 0.8);
        lf.gustTimer = 0; lf.gustCooldown = rand(300, 800);
      }
      lf.x += lf.gustDx * lf.depthFactor;
      lf.y += lf.gustDy * lf.depthFactor;
      lf.gustDx *= 0.97; lf.gustDy *= 0.97;
      if (CONFIG.mouseRadius > 0) {
        var dx = lf.x - mouse.x, dy = lf.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
          var fc = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
          lf.x += (dx / dist) * fc * lf.depthFactor;
          lf.y += (dy / dist) * fc * lf.depthFactor * 0.25;
          lf.rotation += fc * 0.02 * (Math.random() > 0.5 ? 1 : -1);
        }
      }
      if (lf.y > H + 40) { lf.y = rand(-80, -20); lf.x = rand(-60, W + 60); lf.gustDx = 0; lf.gustDy = 0; }
      if (lf.x < -80) lf.x = W + 60;
      if (lf.x > W + 80) lf.x = -60;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < leaves.length; i++) {
      var lf = leaves[i];
      var fx = Math.cos(lf.flipPhase);
      var fy = 0.7 + 0.3 * Math.abs(Math.cos(lf.flipPhase * 0.7));
      if (lf.depthFactor > 0.6 && lf.size > 18) {
        ctx.save(); ctx.globalAlpha = lf.opacity * 0.08;
        ctx.beginPath();
        ctx.ellipse(lf.x + 3, lf.y + 5, lf.size * 0.6, lf.size * 0.3, lf.rotation, 0, Math.PI * 2);
        ctx.fillStyle = '#000000'; ctx.fill(); ctx.restore();
      }
      drawLeaf(lf.x, lf.y, lf.size, lf.rotation, fx, fy, lf.color, lf.opacity);
    }
  }

  function loop() {
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  /* ---------- 初始化入口 ---------- */
  function init() {
    // 通过 ID 判断是否已存在，防止 Pjax 重复创建
    if (document.getElementById('maple-leaves-canvas')) return;

    canvas = document.createElement('canvas');
    canvas.id = 'maple-leaves-canvas';
    ctx = canvas.getContext('2d');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:100;pointer-events:none;';
    document.body.appendChild(canvas);

    // 先执行一次尺寸计算
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 绑定事件（先解绑再绑定，防止内存泄漏）
    window.removeEventListener('resize', onResize);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);
    if (CONFIG.mouseRadius > 0) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseleave', onMouseLeave);
    }

    initLeaves();
    loop();
  }

  // 清理函数（Pjax 切换前调用）
  function destroy() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    var old = document.getElementById('maple-leaves-canvas');
    if (old) old.remove();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseleave', onMouseLeave);
    leaves = [];
  }

  /* ---------- 启动与 Pjax 兼容 ---------- */
  // 等 DOM 就绪后再执行（解决脚本在 <head> 中 body 还不存在的问题）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 监听 Redefine 的 Pjax 事件，页面切换时重建
  document.addEventListener('pjax:complete', function () {
    destroy();
    // Pjax 切换后需要等一小会让新 body 就绪
    setTimeout(init, 50);
  });
  document.addEventListener('pjax:end', function () {
    if (!document.getElementById('maple-leaves-canvas')) {
      setTimeout(init, 50);
    }
  });

})();
