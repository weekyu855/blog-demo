
(() => {
  "use strict";

  if (window.__mapleFallInitialized) return;
  window.__mapleFallInitialized = true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const CONFIG = {
    interval: 750,
    maxLeaves: 20,
    minSize: 26,
    maxSize: 48,
    minDuration: 9,
    maxDuration: 17,
    sway: 65,
    colors: [
      ["#8f1715", "#c92720", "#f15b3a"],
      ["#a61d18", "#e23b25", "#ff8250"],
      ["#9e2718", "#d94324", "#f78b3e"],
      ["#a8321d", "#e45b2b", "#ffb34d"],
      ["#7e1c1c", "#bd3026", "#ed6a43"],
      ["#a33c17", "#d96a20", "#f7a63e"]
    ]
  };

  const style = document.createElement("style");

  style.textContent = `
    #maple-fall-container {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 9999;
      contain: strict;
    }

    .maple-fall-leaf {
      position: absolute;
      top: -70px;
      left: 0;
      width: var(--leaf-size);
      height: var(--leaf-size);
      pointer-events: none;
      user-select: none;
      will-change: transform;
      transform-origin: center;
      animation: maple-fall-drop linear forwards;
    }

    .maple-fall-leaf svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      filter: drop-shadow(0 2px 2px rgba(45, 15, 5, .2));
    }

    @keyframes maple-fall-drop {
      0% {
        transform: translate3d(0, -8vh, 0) rotate(0deg) rotateY(0deg);
      }
      25% {
        transform: translate3d(var(--sway-a), 25vh, 0) rotate(100deg) rotateY(35deg);
      }
      50% {
        transform: translate3d(var(--sway-b), 52vh, 0) rotate(230deg) rotateY(145deg);
      }
      75% {
        transform: translate3d(var(--sway-c), 80vh, 0) rotate(390deg) rotateY(260deg);
      }
      100% {
        transform: translate3d(var(--sway-d), 112vh, 0) rotate(540deg) rotateY(360deg);
      }
    }

    @media (max-width: 768px) {
      #maple-fall-container {
        opacity: .82;
      }
    }
  `;

  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "maple-fall-container";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);

  /*
   * 五裂糖枫叶轮廓
   * 中央主裂片 + 左右上侧裂片 + 左右下侧裂片
   * 通过锯齿折线和掌状分叉叶脉增强真实感
   */
  function createLeafSVG(id, colors, flip) {
    const [dark, mid, light] = colors;

    const outline = `
      M 50 96
      L 46 83 L 42 87 L 39 79
      L 34 84 L 32 75
      L 25 79 L 27 69
      L 17 72 L 21 63
      L 8 62 L 17 54
      L 3 47 L 20 44
      L 14 32 L 28 36
      L 27 21 L 39 31
      L 50 3
      L 61 31 L 73 21
      L 72 36 L 86 32
      L 80 44 L 97 47
      L 83 54 L 92 62
      L 79 63 L 83 72
      L 73 69 L 75 79
      L 68 75 L 66 84
      L 61 79 L 58 87
      L 54 83 Z
    `;

    const veins = `
      <g fill="none"
         stroke-linecap="round"
         stroke-linejoin="round">

        <!-- 主叶脉 -->
        <path d="M50 96 L50 12"
          stroke="${dark}" stroke-width="2.2" opacity=".9"/>

        <!-- 五条掌状主脉 -->
        <path d="
          M50 72 L20 44
          M50 60 L28 36
          M50 47 L39 31
          M50 60 L80 44
          M50 47 L61 31
          M50 72 L80 44
          M50 80 L33 69
          M50 80 L67 69"
          stroke="${dark}" stroke-width="1.35" opacity=".85"/>

        <!-- 细小侧脉 -->
        <path d="
          M38 61 L27 57
          M32 54 L22 51
          M37 48 L30 43
          M40 40 L35 36
          M62 61 L73 57
          M68 54 L78 51
          M63 48 L70 43
          M60 40 L65 36
          M43 76 L35 73
          M57 76 L65 73"
          stroke="${dark}" stroke-width=".8" opacity=".65"/>

        <!-- 叶脉高光 -->
        <path d="
          M51 15 L51 94
          M49 70 L21 45
          M49 59 L29 37
          M49 46 L40 32
          M51 59 L79 45
          M51 46 L60 32"
          stroke="${light}" stroke-width=".55" opacity=".7"/>
      </g>
    `;

    return `
      <svg viewBox="0 0 100 104"
           xmlns="http://www.w3.org/2000/svg"
           aria-hidden="true">

        <defs>
          <linearGradient id="${id}-grad"
            x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="${dark}"/>
            <stop offset="48%" stop-color="${mid}"/>
            <stop offset="100%" stop-color="${light}"/>
          </linearGradient>

          <linearGradient id="${id}-shine"
            x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff5cf" stop-opacity=".25"/>
            <stop offset="50%" stop-color="#fff" stop-opacity=".03"/>
            <stop offset="100%" stop-color="#52120c" stop-opacity=".2"/>
          </linearGradient>

          <clipPath id="${id}-clip">
            <path d="${outline}"/>
          </clipPath>
        </defs>

        <g transform="${flip ? "translate(100 0) scale(-1 1)" : ""}">
          <!-- 叶片底色 -->
          <path d="${outline}"
            fill="url(#${id}-grad)"
            stroke="${dark}"
            stroke-width="1.15"
            stroke-linejoin="round"/>

          <!-- 叶片渐变与叶脉 -->
          <g clip-path="url(#${id}-clip)">
            <path d="${outline}" fill="url(#${id}-shine)"/>
            ${veins}
          </g>

          <!-- 叶柄 -->
          <path d="M50 93 Q49 100 45 104"
            fill="none"
            stroke="${dark}"
            stroke-width="2.4"
            stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }

  let leafId = 0;
  let timer = null;

  function createLeaf() {
    if (container.childElementCount >= CONFIG.maxLeaves) return;

    const leaf = document.createElement("div");
    leaf.className = "maple-fall-leaf";

    const size =
      CONFIG.minSize +
      Math.random() * (CONFIG.maxSize - CONFIG.minSize);

    const duration =
      CONFIG.minDuration +
      Math.random() * (CONFIG.maxDuration - CONFIG.minDuration);

    const colors =
      CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];

    const sway = CONFIG.sway;
    const offset = () =>
      Math.round((Math.random() * 2 - 1) * sway) + "px";

    leaf.style.setProperty("--leaf-size", size + "px");
    leaf.style.setProperty("--sway-a", offset());
    leaf.style.setProperty("--sway-b", offset());
    leaf.style.setProperty("--sway-c", offset());
    leaf.style.setProperty("--sway-d", offset());

    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.opacity = String(.65 + Math.random() * .35);
    leaf.style.animationDuration = duration + "s";

    leaf.innerHTML = createLeafSVG(
      "maple-" + (++leafId),
      colors,
      Math.random() > .5
    );

    container.appendChild(leaf);

    leaf.addEventListener("animationend", () => {
      leaf.remove();
    }, { once: true });
  }

  function start() {
    if (timer !== null) return;
    timer = window.setInterval(createLeaf, CONFIG.interval);
  }

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  start();
})();
