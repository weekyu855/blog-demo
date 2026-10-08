/**
 * 「AI 绘图」页面逻辑（/ai-image/）
 *
 * 页面：source/ai-image/index.md（front-matter 里 template: ai-image）
 * 模板：themes/redefine/layout/pages/ai-image/ai-image.ejs
 * 后端：Cloudflare Worker（Workers AI 文生图）——POST JSON，直接把图片二进制作为响应体返回。
 *
 * 注意事项：
 * 1) Worker 的 CORS 是 *，浏览器可以直接跨域调用，不需要后端代理。
 * 2) Worker 对 flux-1-schnell 声明的 content-type 是 image/png，但实际返回的是 JPEG 字节，
 *    所以这里统一按魔术字节嗅探真实格式，避免下载下来的文件扩展名与内容不符。
 * 3) 本页处于 Swup 单页导航下，用 swup.hooks.on("page:view") + DOMContentLoaded 双保险初始化，
 *    并且用 dataset 标记做幂等，避免同一次渲染初始化两遍。
 */

const AI_IMAGE_ENDPOINT = "https://image.weekyu.dpdns.org/";
const AI_IMAGE_MAX_WAIT = 120000; // 单次生成的最长等待时间（毫秒）
const AI_IMAGE_PASSWORD_KEY = "week-ai-image-password"; // 访问密码存在本地，页面源码里不放明文

// 接口不可用时的兜底模型列表（与 Worker 里的 AVAILABLE_MODELS 保持一致）
const AI_IMAGE_MODELS_FALLBACK = [
	{
		id: "flux-1-schnell",
		name: "FLUX.1 [schnell]",
		description: "速度最快，细节表现好，适合大多数场景",
	},
	{
		id: "stable-diffusion-xl-base-1.0",
		name: "Stable Diffusion XL Base 1.0",
		description: "SDXL 基础模型，风格均衡",
	},
	{
		id: "dreamshaper-8-lcm",
		name: "DreamShaper 8 LCM",
		description: "偏写实，光影层次更好",
	},
	{
		id: "stable-diffusion-xl-lightning",
		name: "Stable Diffusion XL Lightning",
		description: "步数少，出图快",
	},
];

// 自己维护的随机提示词：Worker 自带的那套偏二次元向，放在博客上不合适。
const AI_IMAGE_RANDOM_PROMPTS = [
	"a lighthouse at dusk, minimal flat illustration, muted colors, soft gradient sky",
	"a quiet street in the rain, neon reflections on wet asphalt, cinematic, film grain",
	"an old library with sunbeams through tall windows, dust in the air, warm tones",
	"misty mountains at sunrise, layered silhouettes, ink wash painting style",
	"a small cabin in a snowy forest at night, warm window light, starry sky",
	"a cup of coffee on a wooden desk beside a stack of books, soft morning light",
	"a retro space station orbiting a ringed planet, concept art, clean lines",
	"an orange cat sleeping on a windowsill, watercolor, soft edges",
	"a field of sunflowers under dramatic clouds, wide angle, vivid colors",
	"a futuristic city skyline at blue hour, long exposure light trails",
	"an antique map of an imaginary island, parchment texture, detailed linework",
	"a bamboo forest path with lanterns, gentle fog, painterly style",
];

// 各模型的推荐步数：切换模型时重置，避免用 SDXL 的步数去跑 FLUX
const AI_IMAGE_STEPS_DEFAULT = {
	"flux-1-schnell": 4,
	"stable-diffusion-xl-base-1.0": 20,
	"dreamshaper-8-lcm": 20,
	"stable-diffusion-xl-lightning": 6,
};

const AI_IMAGE_STATE = {
	models: AI_IMAGE_MODELS_FALLBACK,
	generating: false,
	objectUrl: null,
	lastResult: null,
	ticker: null,
	startedAt: 0,
};

function aiImageEl(selector, root) {
	return (root || document).querySelector(selector);
}

function aiImageEls(selector, root) {
	return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

function aiImageSniff(buf) {
	const b = new Uint8Array(buf.slice(0, 12));
	// JPEG
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
		return { mime: "image/jpeg", ext: "jpg" };
	}
	// PNG
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
		return { mime: "image/png", ext: "png" };
	}
	// WebP
	if (
		b[8] === 0x57 &&
		b[9] === 0x45 &&
		b[10] === 0x42 &&
		b[11] === 0x50
	) {
		return { mime: "image/webp", ext: "webp" };
	}
	return { mime: "image/png", ext: "png" };
}

function aiImageTimestamp(date) {
	const pad = (n) => String(n).padStart(2, "0");
	return (
		date.getFullYear() +
		pad(date.getMonth() + 1) +
		pad(date.getDate()) +
		"-" +
		pad(date.getHours()) +
		pad(date.getMinutes()) +
		pad(date.getSeconds())
	);
}

function aiImageFormatSize(bytes) {
	if (!bytes && bytes !== 0) return "";
	if (bytes < 1024) return bytes + " B";
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
	return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

function aiImageClamp(value, min, max, fallback) {
	const n = parseInt(value, 10);
	if (isNaN(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

/* ---------------------------------------------------------------- 状态渲染 */

function aiImageSetStatus(root, text, tone) {
	const el = aiImageEl(".ai-image-status", root);
	if (!el) return;
	el.textContent = text || "";
	el.className = "ai-image-status" + (tone ? " is-" + tone : "");
}

function aiImageSetStage(root, stage) {
	// stage: empty | loading | result | error
	aiImageEls(".ai-image-stage", root).forEach((el) => {
		el.classList.toggle("is-active", el.dataset.stage === stage);
	});
}

function aiImageStopTicker() {
	if (AI_IMAGE_STATE.ticker) {
		clearInterval(AI_IMAGE_STATE.ticker);
		AI_IMAGE_STATE.ticker = null;
	}
}

function aiImageStartTicker(root) {
	AI_IMAGE_STATE.startedAt = Date.now();
	aiImageStopTicker();
	const tick = () => {
		const seconds = Math.round((Date.now() - AI_IMAGE_STATE.startedAt) / 1000);
		aiImageSetStatus(
			root,
			"生成中… 已等待 " + seconds + " 秒（免费额度排队时可能更久）",
			"loading"
		);
	};
	tick();
	AI_IMAGE_STATE.ticker = setInterval(tick, 1000);
}

/* ---------------------------------------------------------------- 表单联动 */

function aiImageSelectedModel(root) {
	const select = aiImageEl("#ai-image-model", root);
	return select ? select.value : "flux-1-schnell";
}

function aiImageSyncValue(root, id) {
	const input = aiImageEl("#" + id, root);
	const output = aiImageEl('[data-value-for="' + id + '"]', root);
	if (input && output) output.textContent = input.value;
}

function aiImageSyncValues(root) {
	[
		"ai-image-width",
		"ai-image-height",
		"ai-image-steps",
		"ai-image-guidance",
	].forEach((id) => aiImageSyncValue(root, id));
}

function aiImageApplyModel(root, resetSteps) {
	const model = aiImageSelectedModel(root);
	const isFlux = model === "flux-1-schnell";

	// 所有参数始终可见（FLUX 不理会的那几个也一样，避免看起来"功能缺了"）
	const steps = aiImageEl("#ai-image-steps", root);
	if (steps) {
		const fallback = AI_IMAGE_STEPS_DEFAULT[model] || (isFlux ? 4 : 20);
		steps.value = String(
			resetSteps ? fallback : aiImageClamp(steps.value, 1, 20, fallback)
		);
	}

	const hint = aiImageEl(".ai-image-model-hint", root);
	if (hint) {
		const current = AI_IMAGE_STATE.models.filter((m) => m.id === model)[0];
		const description = current && current.description ? current.description : "";
		hint.textContent = isFlux
			? description + "（只使用提示词和迭代步数，其余参数会被忽略）"
			: description;
	}

	aiImageSyncValues(root);
}

function aiImageCollectPayload(root) {
	const model = aiImageSelectedModel(root);
	const prompt = (aiImageEl("#ai-image-prompt", root) || {}).value || "";
	const payload = { prompt: prompt.trim(), model };

	// 接口如果设了 PASSWORDS，就需要把密码一起发给 Worker 校验；留空则不带这个字段
	const password = ((aiImageEl("#ai-image-password", root) || {}).value || "").trim();
	if (password) payload.password = password;

	if (model === "flux-1-schnell") {
		// 服务端会把 FLUX 的步数夹到 4–8，这里先夹好，保证「复制参数」显示的就是实际值
		payload.num_steps = aiImageClamp(
			(aiImageEl("#ai-image-steps", root) || {}).value,
			4,
			8,
			4
		);
		return payload;
	}

	payload.negative_prompt =
		((aiImageEl("#ai-image-negative", root) || {}).value || "").trim();
	payload.width = aiImageClamp(
		(aiImageEl("#ai-image-width", root) || {}).value,
		256,
		2048,
		1024
	);
	payload.height = aiImageClamp(
		(aiImageEl("#ai-image-height", root) || {}).value,
		256,
		2048,
		1024
	);
	payload.num_steps = aiImageClamp(
		(aiImageEl("#ai-image-steps", root) || {}).value,
		1,
		20,
		20
	);
	payload.guidance = parseFloat(
		(aiImageEl("#ai-image-guidance", root) || {}).value
	);
	if (isNaN(payload.guidance)) payload.guidance = 7.5;

	const seedRaw = ((aiImageEl("#ai-image-seed", root) || {}).value || "").trim();
	if (seedRaw) {
		const seed = parseInt(seedRaw, 10);
		if (!isNaN(seed)) payload.seed = seed;
	}
	return payload;
}

/* ---------------------------------------------------------------- 模型列表 */

function aiImageRenderModels(root, models) {
	const select = aiImageEl("#ai-image-model", root);
	if (!select || !models || !models.length) return;
	const previous = select.value;
	AI_IMAGE_STATE.models = models;
	select.innerHTML = "";
	models.forEach((model) => {
		const option = document.createElement("option");
		option.value = model.id;
		option.textContent = model.name || model.id;
		select.appendChild(option);
	});
	if (previous && models.some((m) => m.id === previous)) {
		select.value = previous;
	}
}

function aiImageLoadModels(root) {
	fetch(AI_IMAGE_ENDPOINT + "api/models", { method: "GET" })
		.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
		.then((models) => {
			if (Array.isArray(models) && models.length) {
				aiImageRenderModels(root, models);
				aiImageApplyModel(root);
			}
		})
		.catch(() => {
			// 拿不到就用本地兜底列表，不打扰用户
		});
}

/* ---------------------------------------------------------------- 访问密码 */

function aiImageLoadPassword(root) {
	const input = aiImageEl("#ai-image-password", root);
	if (!input) return;
	try {
		const saved = window.localStorage.getItem(AI_IMAGE_PASSWORD_KEY);
		if (saved) input.value = saved;
	} catch (error) {
		// 隐私模式 / 禁用存储时忽略，不影响正常使用
	}
}

function aiImageRememberPassword(root, payload) {
	try {
		if (payload && payload.password) {
			window.localStorage.setItem(AI_IMAGE_PASSWORD_KEY, payload.password);
		} else {
			window.localStorage.removeItem(AI_IMAGE_PASSWORD_KEY);
		}
	} catch (error) {
		// 同上
	}
}

/* ---------------------------------------------------------------- 生成流程 */

function aiImageReadError(res) {
	return res
		.json()
		.then((data) => {
			if (data && data.error) {
				return data.details ? data.error + "：" + data.details : data.error;
			}
			return "";
		})
		.catch(() => "");
}

function aiImageFriendlyError(error) {
	if (error && error.name === "AbortError") {
		return "等待超时了（超过 " + AI_IMAGE_MAX_WAIT / 1000 + " 秒）。可以稍后重试，或换用 FLUX.1 schnell 并降低步数。";
	}
	if (error && error.status === 429) {
		return "Cloudflare 免费额度今天可能已经用完了，请过一段时间再试。";
	}
	if (error && error.status === 403) {
		return "需要访问密码：这个接口只对朋友开放，在「访问密码」里填对之后再来一次。";
	}
	if (error && error.status === 400) {
		return "参数不合法：" + (error.message || "请检查提示词与模型") + "。";
	}
	if (error && error.status) {
		return (
			"生成失败（HTTP " + error.status + "）：" + (error.message || "服务端返回了错误")
		);
	}
	if (error && error.message) return "生成失败：" + error.message;
	return "生成失败，请稍后重试。";
}

function aiImageShowResult(root, blob, payload, elapsed, ext) {
	if (AI_IMAGE_STATE.objectUrl) {
		URL.revokeObjectURL(AI_IMAGE_STATE.objectUrl);
	}
	AI_IMAGE_STATE.objectUrl = URL.createObjectURL(blob);

	const img = aiImageEl(".ai-image-result-img", root);
	if (img) {
		img.src = AI_IMAGE_STATE.objectUrl;
	}

	const filename = "week-ai-" + aiImageTimestamp(new Date()) + "." + (ext || "png");

	// 存参数时去掉密码，避免「复制参数」把密码带进剪贴板
	const safePayload = Object.assign({}, payload);
	delete safePayload.password;

	AI_IMAGE_STATE.lastResult = {
		blob: blob,
		payload: safePayload,
		filename: filename,
		url: AI_IMAGE_STATE.objectUrl,
	};

	const meta = aiImageEl(".ai-image-meta", root);
	if (meta) {
		meta.textContent =
			payload.model +
			" · " +
			(elapsed / 1000).toFixed(1) +
			" 秒 · " +
			aiImageFormatSize(blob.size);
	}

	aiImageSetStatus(root, "生成完成，点图片可放大，或直接下载。", "ok");
	aiImageSetStage(root, "result");
}

function aiImageGenerate(root) {
	if (AI_IMAGE_STATE.generating) return;

	const payload = aiImageCollectPayload(root);
	if (!payload.prompt) {
		aiImageSetStatus(root, "先写一句提示词吧，比如「a lighthouse at dusk, minimal flat illustration」。", "warn");
		const promptEl = aiImageEl("#ai-image-prompt", root);
		if (promptEl) promptEl.focus();
		return;
	}

	const button = aiImageEl(".ai-image-submit", root);
	AI_IMAGE_STATE.generating = true;
	if (button) {
		button.disabled = true;
		button.setAttribute("aria-busy", "true");
	}
	aiImageSetStage(root, "loading");
	aiImageStartTicker(root);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), AI_IMAGE_MAX_WAIT);
	const startedAt = Date.now();

	fetch(AI_IMAGE_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		signal: controller.signal,
	})
		.then((res) => {
			if (res.ok) return res.arrayBuffer();
			return aiImageReadError(res).then((message) => {
				const error = new Error(message || "服务端返回了错误");
				error.status = res.status;
				throw error;
			});
		})
		.then((buf) => {
			const sniffed = aiImageSniff(buf);
			const blob = new Blob([buf], { type: sniffed.mime });
			aiImageShowResult(root, blob, payload, Date.now() - startedAt, sniffed.ext);
			// 生成成功才记住密码，避免把输错的密码存下来
			aiImageRememberPassword(root, payload);
		})
		.catch((error) => {
			aiImageSetStage(root, "error");
			aiImageSetStatus(root, aiImageFriendlyError(error), "error");
		})
		.finally(() => {
			clearTimeout(timeout);
			aiImageStopTicker();
			AI_IMAGE_STATE.generating = false;
			if (button) {
				button.disabled = false;
				button.removeAttribute("aria-busy");
			}
		});
}

/* ---------------------------------------------------------------- 交互绑定 */

function aiImageBind(root) {
	const form = aiImageEl(".ai-image-form", root);
	if (form) {
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			aiImageGenerate(root);
		});
	}

	const modelSelect = aiImageEl("#ai-image-model", root);
	if (modelSelect) {
		modelSelect.addEventListener("change", () => aiImageApplyModel(root, true));
	}

	const randomButton = aiImageEl(".ai-image-random", root);
	if (randomButton) {
		randomButton.addEventListener("click", () => {
			const promptEl = aiImageEl("#ai-image-prompt", root);
			if (!promptEl) return;
			const current = promptEl.value.trim();
			let next = current;
			while (next === current && AI_IMAGE_RANDOM_PROMPTS.length > 1) {
				next =
					AI_IMAGE_RANDOM_PROMPTS[
						Math.floor(Math.random() * AI_IMAGE_RANDOM_PROMPTS.length)
					];
			}
			promptEl.value = next;
		});
	}

	const promptEl = aiImageEl("#ai-image-prompt", root);
	if (promptEl) {
		promptEl.addEventListener("keydown", (event) => {
			if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
				event.preventDefault();
				aiImageGenerate(root);
			}
		});
	}

	const downloadButton = aiImageEl(".ai-image-download", root);
	if (downloadButton) {
		downloadButton.addEventListener("click", () => {
			const result = AI_IMAGE_STATE.lastResult;
			if (!result) return;
			const link = document.createElement("a");
			link.href = result.url;
			link.download = result.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		});
	}

	const openButton = aiImageEl(".ai-image-open", root);
	if (openButton) {
		openButton.addEventListener("click", () => {
			const result = AI_IMAGE_STATE.lastResult;
			if (result) window.open(result.url, "_blank", "noopener");
		});
	}

	const resultImage = aiImageEl(".ai-image-result-img", root);
	if (resultImage) {
		resultImage.addEventListener("click", () => {
			const result = AI_IMAGE_STATE.lastResult;
			if (result) window.open(result.url, "_blank", "noopener");
		});
	}

	const copyButton = aiImageEl(".ai-image-copy", root);
	if (copyButton) {
		copyButton.addEventListener("click", () => {
			const result = AI_IMAGE_STATE.lastResult;
			if (!result) return;
			const text = JSON.stringify(result.payload, null, 2);
			const done = () => aiImageSetStatus(root, "参数已复制到剪贴板。", "ok");
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(done, () => {
					aiImageSetStatus(root, "复制失败，可以手动选中参数文本。", "warn");
				});
			} else {
				aiImageSetStatus(root, "当前浏览器不支持自动复制，请手动选中参数文本。", "warn");
			}
		});
	}

	const againButton = aiImageEl(".ai-image-again", root);
	if (againButton) {
		againButton.addEventListener("click", () => aiImageGenerate(root));
	}

	// 滑动条：实时把数值显示在标签右边
	[
		"ai-image-width",
		"ai-image-height",
		"ai-image-steps",
		"ai-image-guidance",
	].forEach((id) => {
		const input = aiImageEl("#" + id, root);
		if (input) {
			input.addEventListener("input", () => aiImageSyncValue(root, id));
		}
	});

	aiImageApplyModel(root);
}

/* ---------------------------------------------------------------- 生命周期 */

function aiImageInit() {
	const root = aiImageEl(".ai-image-page");
	if (!root) return;
	if (root.dataset.aiImageReady === "1") return;
	root.dataset.aiImageReady = "1";
	aiImageBind(root);
	aiImageSetStage(root, "empty");
	aiImageLoadPassword(root);
	// 先用本地兜底列表把下拉框填满，拿到接口列表后再覆盖
	aiImageRenderModels(root, AI_IMAGE_STATE.models);
	aiImageApplyModel(root);
	aiImageLoadModels(root);
}

function aiImageCleanup() {
	aiImageStopTicker();
	AI_IMAGE_STATE.lastResult = null;
	if (AI_IMAGE_STATE.objectUrl) {
		URL.revokeObjectURL(AI_IMAGE_STATE.objectUrl);
		AI_IMAGE_STATE.objectUrl = null;
	}
}

try {
	swup.hooks.on("page:view", aiImageInit);
	swup.hooks.on("visit:start", aiImageCleanup);
} catch (error) {
	// Swup 不可用（比如关掉了单页模式）时走下面的 DOMContentLoaded
}

document.addEventListener("swup:page:view", aiImageInit);
document.addEventListener("DOMContentLoaded", aiImageInit);
aiImageInit();
