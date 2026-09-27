
(() => {
  "use strict";

  if (window.__mapleFallInitialized) return;
  window.__mapleFallInitialized = true;

  // 尊重系统减少动态效果设置
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const CONFIG = {
    interval: 700,       // 生成间隔，毫秒
    maxLeaves: 20,       // 同屏最大叶片数量
    minSize: 24,         // 最小叶片尺寸，px
    maxSize: 48,         // 最大叶片尺寸，px
    minDuration: 9,      // 最短飘落时间，秒
    maxDuration: 17,     // 最长飘落时间，秒
    sway: 65,            // 左右摆动幅度
    colors: [
      ["#a91f18", "#e53b24", "#ff7950"],
      ["#bd2b19", "#f04b25", "#ff9b43"],
      ["#a52a22", "#d9442c", "#ed7c40"],
      ["#c74a13", "#f28a22", "#ffc24d"],
      ["#b52c25", "#df4c31", "#f9a05b"],
      ["#8f291f", "#c83b2c", "#e86c43"]
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
      top: -80px;
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
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
      filter: drop-shadow(0 2px 2px rgba(55, 20, 5, 0.18));
    }

    @keyframes maple-fall-drop {
      0% {
        transform:
          translate3d(0, -8vh, 0)
          rotate(0deg)
          rotateY(0deg);
      }

      20% {
        transform:
          translate3d(var(--sway-a), 20vh, 0)
          rotate(100deg)
          rotateY(35deg);
      }

      42% {
        transform:
          translate3d(var(--sway-b), 43vh, 0)
          rotate(230deg)
          rotateY(115deg);
      }

      65% {
        transform:
          translate3d(var(--sway-c), 68vh, 0)
          rotate(340deg)
          rotateY(210deg);
      }

      82% {
        transform:
          translate3d(var(--sway-d), 88vh, 0)
          rotate(480deg)
          rotateY(285deg);
      }

      100% {
        transform:
          translate3d(var(--sway-e), 112vh, 0)
          rotate(620deg)
          rotateY(360deg);
      }
    }

    @media (max-width: 768px) {
      #maple-fall-container {
        opacity: 0.85;
      }
    }
  `;

  document.head.appendChild(style);

  const container = document.createElement("div");
  container.id = "maple-fall-container";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);

  // 五裂枫叶轮廓，配合锯齿边缘和自然叶脉
  function createLeafSVG(id, colors, flip) {
    const [dark, mid, light] = colors;

    // 叶片外轮廓：中央主裂片、两侧裂片与基部裂片
    const path = `
      M 50 96
      L 46 77
      L 35 84
      L 38 69
      L 21 73
      L 28 59
      L 7 57
      L 19 46
      L 4 35
      L 26 35
      L 24 17
      L 40 27
      L 50 2
      L 60 27
      L 76 17
      L 74 35
      L 96 35
      L 81 46
      L 93 57
      L 72 59
      L 79 73
      L 62 69
      L 65 84
      L 54 77
      Z
    `;

    // 主叶脉及分支
    const veins = `
      <g fill="none" stroke-linecap="round">
        <path d="M50 96 L50 13"
          stroke="${dark}" stroke-width="2.1" opacity=".85"/>

        <path d="M50 70 L28 43
                 M50 61 L74 43
                 M50 50 L35 30
                 M50 45 L65 30
                 M50 80 L34 65
                 M50 80 L66 65"
          stroke="${dark}" stroke-width="1.35" opacity=".75"/>

        <path d="M50 70 L28 43
                 M50 61 L74 43
                 M50 50 L35 30
                 M50 45 L65 30
                 M50 80 L34 65
                 M50 80 L66 65"
          stroke="${light}" stroke-width=".65" opacity=".65"/>

        <path d="M50 84 L44 90
                 M50 84 L56 90"
          stroke="${dark}" stroke-width="1.1" opacity=".7"/>
      </g>
    `;

    return `
      <svg viewBox="0 0 100 104"
           xmlns="http://www.w3.org/2000/svg"
           aria-hidden="true">
        <defs>
          <linearGradient id="${id}-fill"
                          x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="${dark}"/>
            <stop offset="48%" stop-color="${mid}"/>
            <stop offset="100%" stop-color="${light}"/>
          </linearGradient>

          <linearGradient id="${id}-shine"
                          x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff4cb" stop-opacity=".3"/>
            <stop offset="50%" stop-color="#fff" stop-opacity=".03"/>
            <stop offset="100%" stop-color="#64130b" stop-opacity=".2"/>
          </linearGradient>

          <clipPath id="${id}-clip">
            <path d="${path}"/>
          </clipPath>
        </defs>

        <g transform="${flip ? "translate(100 0) scale(-1 1)" : ""}">
          <path d="${path}"
                fill="url(#${id}-fill)"
                stroke="${dark}"
                stroke-width="1.1"
                stroke-linejoin="round"/>

          <g clip-path="url(#${id}-clip)">
            <path d="${path}" fill="url(#${id}-shine)"/>

            <path d="M50 8
                     C43 31 44 53 50 96
                     C55 65 59 34 50 8 Z"
                  fill="${light}" opacity=".12"/>

            ${veins}
          </g>

          <path d="M50 96 Q49 101 46 104"
                fill="none"
                stroke="${dark}"
                stroke-width="2"
                stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }

  let leafId = 0;

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

    const randomOffset = () =>
      Math.round((Math.random() * 2 - 1) * sway) + "px";

    leaf.style.setProperty("--leaf-size", size + "px");
    leaf.style.setProperty("--sway-a", randomOffset());
    leaf.style.setProperty("--sway-b", randomOffset());
    leaf.style.setProperty("--sway-c", randomOffset());
    leaf.style.setProperty("--sway-d", randomOffset());
    leaf.style.setProperty("--sway-e", randomOffset());

    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.opacity = String(0.65 + Math.random() * 0.35);
    leaf.style.animationDuration = duration + "s";

    const flip = Math.random() > 0.5;
    leaf.innerHTML = createLeafSVG(
      "maple-" + (++leafId),
      colors,
      flip
    );

    container.appendChild(leaf);

    leaf.addEventListener("animationend", () => {
      leaf.remove();
    }, { once: true });
  }

  let timer = null;

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
