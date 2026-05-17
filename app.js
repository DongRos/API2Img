const CONFIG_KEY = "image2.canvas.config.v1";
const CONFIG_VERSION = 2;
const CONFIG_HISTORY_KEY = "image2.canvas.config.history.v1";
const GENERATION_LOGS_KEY = "image2.generation.logs.v1";
const API_STATS_KEY = "image2.api.stats.v1";
const FLOW_STATE_KEY = "image2.flow.state.v1";
const CODE_ADMIN_PASSWORD_KEY = "image2.code.admin.password.v1";
const CONFIG_HISTORY_LIMIT = 12;
const GENERATION_LOG_LIMIT = 30;
const API_STATS_LIMIT = 80;
const API_STATS_OPEN_PHRASE = "apistats";
const CODE_ADMIN_OPEN_PHRASE = "codeadmin";
const SINGLE_IMAGE_MAX_ATTEMPTS = 2;
const PLATFORM_PRICE_FALLBACK_CENTS = 10;
const PLATFORM_MAX_BATCH_REQUEST_COUNT = 1;
const FLOW_DB_NAME = "image2.flow.history";
const FLOW_DB_VERSION = 1;
const FLOW_META_STORE = "meta";
const FLOW_RESULTS_STORE = "results";
const FLOW_REFERENCES_STORE = "references";
const FLOW_META_ID = "flow";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const ratioPresets = [
  { label: "自适应", value: "auto", sizes: ["auto"] },
  { label: "1:1 方图", value: "1:1", sizes: ["1024x1024", "1536x1536"] },
  { label: "4:3 横图", value: "4:3", sizes: ["1152x896", "1600x1200"] },
  { label: "3:4 竖图", value: "3:4", sizes: ["896x1152", "1200x1600"] },
  { label: "16:9 宽屏", value: "16:9", sizes: ["1344x768", "1920x1080"] },
  { label: "9:16 竖屏", value: "9:16", sizes: ["768x1344", "1080x1920"] },
  { label: "2:3 海报", value: "2:3", sizes: ["832x1216", "1024x1536"] },
  { label: "3:2 摄影", value: "3:2", sizes: ["1216x832", "1536x1024"] },
];

const qualityPresets = [
  { label: "标准", value: "standard" },
  { label: "高清", value: "hd" },
  { label: "高质量", value: "high" },
  { label: "极速草稿", value: "draft" },
];

const defaultTemplate = `{
  "model": "{{model}}",
  "prompt": "{{prompt}}",
  "negative_prompt": "{{negativePrompt}}",
  "size": "{{size}}",
  "n": {{count}},
  "quality": "{{quality}}",
  "seed": "{{seed}}",
  "images": {{referenceImages}}
}`;

const iconPaths = {
  "arrow-left": '<path d="m15 18-6-6 6-6"/><path d="M21 12H9"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 8 9 9 0 1 1-9-8"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 1 1 7.1 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 17V9"/><path d="M13 17V5"/><path d="M18 17v-6"/>',
  wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H7"/><path d="M16 14h.01"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
  sparkles: '<path d="m12 3-1.8 5.4L5 10.2l5.2 1.8L12 17l1.8-5 5.2-1.8-5.2-1.8Z"/><path d="M5 3v4"/><path d="M3 5h4"/>',
};

const config = {
  textEndpoint: "",
  editEndpoint: "",
  apiKey: "",
  rememberKey: false,
  requestFormat: "openai",
  transportMode: "direct",
  customTemplate: defaultTemplate,
  multiImageMode: "single",
  modelName: "gpt-image-2",
  apiProvider: "platform",
};

const state = {
  theme: "dark",
  results: [],
  references: [],
  selectedResultId: "",
  lastOptions: null,
  latestGenerationId: "",
};

const billingState = {
  customerId: "",
  balanceCents: 0,
  priceCents: PLATFORM_PRICE_FALLBACK_CENTS,
  upstreamCostCents: 4,
  platformEnabled: false,
  lastDirectConfig: null,
  orders: [],
  usage: [],
  redemptions: [],
  activeOrder: null,
};

let toastTimer = null;
let progressTimer = null;
let progressStartedAt = 0;
let currentProgress = 0;
let progressGenerated = 0;
let progressTotal = 0;
let configHistory = [];
let generationLogs = [];
let apiStats = [];
let activeGenerationLog = null;
let isGenerating = false;
let generationAbortController = null;
let generationCancelled = false;
let flowDbPromise = null;
let statsOpenBuffer = "";
let codeAdminOpenBuffer = "";
let lastCodeAdminCsv = "";
let lastCodeAdminFilename = "";
const detailView = {
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
};

async function init() {
  fillControls();
  loadConfig();
  loadConfigHistory();
  loadGenerationLogs();
  loadApiStats();
  await loadBilling();
  await loadState();
  hydrateConfig();
  renderConfigHistory();
  renderGenerationLogs();
  renderApiStats();
  renderWallet();
  bindEvents();
  renderReferences();
  renderResults();
  renderIcons();
  autoGrow($("#promptInput"));
}

function fillControls() {
  $("#ratioSelect").innerHTML = ratioPresets.map((item) => optionHtml(item.value, item.label)).join("");
  $("#countSelect").innerHTML = [1, 2, 3, 4, 6, 8].map((count) => optionHtml(String(count), `${count} 张`)).join("");
  $("#qualitySelect").innerHTML = qualityPresets.map((item) => optionHtml(item.value, item.label)).join("");
  syncSizeOptions();
}

function bindEvents() {
  $("#settingsToggle").addEventListener("click", () => $("#settingsPanel").classList.toggle("open"));
  $("#closeSettings").addEventListener("click", () => $("#settingsPanel").classList.remove("open"));
  $("#walletToggle").addEventListener("click", () => {
    $("#walletPanel").classList.toggle("open");
    refreshBilling();
  });
  $("#closeWallet").addEventListener("click", () => $("#walletPanel").classList.remove("open"));
  $("#apiProviderSelect").addEventListener("change", onApiProviderChange);
  $("#redeemCodeButton").addEventListener("click", redeemCode);
  $("#redeemCodeInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      redeemCode();
    }
  });
  $("#saveConfigButton").addEventListener("click", saveConfigFromForm);
  $("#themeButton").addEventListener("click", toggleTheme);
  $("#uploadButton").addEventListener("click", () => $("#imageInput").click());
  $("#imageInput").addEventListener("change", onReferenceFiles);
  $("#generateButton").addEventListener("click", () => generateImages());
  $("#editGenerateButton").addEventListener("click", generateFromDetail);
  $("#clearResultsButton").addEventListener("click", clearResults);
  $("#logsToggle").addEventListener("click", () => {
    $("#logsPanel").classList.toggle("open");
    renderGenerationLogs();
  });
  $("#closeLogs").addEventListener("click", () => $("#logsPanel").classList.remove("open"));
  $("#clearLogsButton").addEventListener("click", clearGenerationLogs);
  $("#closeStats").addEventListener("click", () => $("#statsPanel").classList.remove("open"));
  $("#clearStatsButton").addEventListener("click", clearApiStats);
  $("#closeCodeAdmin").addEventListener("click", () => $("#codeAdminPanel").classList.remove("open"));
  $("#generateCodesButton").addEventListener("click", generateRedeemCodesFromPanel);
  $("#copyCodesButton").addEventListener("click", copyGeneratedCodes);
  $("#downloadCodesButton").addEventListener("click", downloadLastCodeCsv);
  $("#codeAdminAmount").addEventListener("input", syncCodeAdminLabel);
  $("#loadPlatformConfigButton").addEventListener("click", loadPlatformAdminConfig);
  $("#savePlatformConfigButton").addEventListener("click", savePlatformAdminConfig);
  $("#cancelGenerateButton").addEventListener("click", cancelGeneration);
  $("#generationProgress").addEventListener("click", onProgressClick);
  $("#ratioSelect").addEventListener("change", syncSizeOptions);
  $("#multiImageMode").addEventListener("change", saveMultiImageMode);
  $("#requestFormat").addEventListener("change", updateTemplateVisibility);
  $("#configHistoryList").addEventListener("click", onConfigHistoryClick);
  $("#modelName").addEventListener("change", onModelSelect);
  $("#closeDetail").addEventListener("click", closeDetail);
  $("#doneDetail").addEventListener("click", closeDetail);
  $("#downloadDetail").addEventListener("click", downloadSelected);
  $("#deleteDetail").addEventListener("click", deleteSelected);
  $("#reusePrompt").addEventListener("click", reuseSelectedPrompt);
  $("#detailViewport").addEventListener("wheel", onDetailWheel, { passive: false });
  $("#detailViewport").addEventListener("pointerdown", onDetailPointerDown);
  $("#detailViewport").addEventListener("dblclick", resetDetailView);
  window.addEventListener("pointermove", onDetailPointerMove);
  window.addEventListener("pointerup", onDetailPointerUp);
  window.addEventListener("keydown", onGlobalKeyDown);
  $("#promptInput").addEventListener("input", (event) => autoGrow(event.target));
  $("#promptInput").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      generateImages();
    }
  });
  window.addEventListener("resize", debounce(layoutResultMasonry, 120));
  if (new URLSearchParams(location.search).has("admin")) openCodeAdminPanel();
}

function onModelSelect() {
  if ($("#modelName").value !== "custom") return;
  const custom = prompt("输入自定义模型名称", config.modelName || "gpt-image-2");
  if (!custom) {
    $("#modelName").value = config.modelName || "gpt-image-2";
    return;
  }
  ensureModelOption(custom);
  $("#modelName").value = custom;
}

async function generateImages(extra = {}) {
  if (isGenerating) {
    showToast("正在生成中，请稍候");
    return;
  }

  const prompt = (extra.prompt ?? $("#promptInput").value).trim();
  if (!prompt) {
    showToast("先输入提示词");
    return;
  }

  const mode = extra.mode || $("#modeSelect").value;
  const usePlatformApi = isPlatformApiSelected();
  if (usePlatformApi && !billingState.platformEnabled) {
    $("#walletPanel").classList.add("open");
    showToast("推荐 API 暂未配置，请联系站长处理");
    return;
  }
  if (mode === "image" && !state.references.length) {
    showToast("图生图需要先上传参考图");
    return;
  }
  const endpointInfo = resolveEndpointForMode(mode);
  const endpoint = endpointInfo.endpoint;
  if (!endpoint) {
    if (usePlatformApi) $("#walletPanel").classList.add("open");
    else $("#settingsPanel").classList.add("open");
    showToast(endpointInfo.message || "请先配置 API URL");
    return;
  }
  if (endpointInfo.inferred) {
    showToast(endpointInfo.message);
  }

  const generationId = makeId();
  generationAbortController = new AbortController();
  generationCancelled = false;
  const options = {
    mode,
    prompt,
    negativePrompt: $("#negativePrompt").value.trim(),
    ratio: $("#ratioSelect").value,
    size: $("#sizeSelect").value,
    count: Number($("#countSelect").value),
    multiImageMode: $("#multiImageMode").value,
    quality: $("#qualitySelect").value,
    seed: $("#seedInput").value.trim(),
    model: getModelName(),
    referenceImages: mode === "image" ? [...state.references] : [],
    generationId,
    abortSignal: generationAbortController.signal,
    apiProvider: usePlatformApi ? "platform" : "custom",
    platformPriceCents: usePlatformApi ? billingState.priceCents : 0,
  };
  if (usePlatformApi) {
    const requiredCents = options.count * billingState.priceCents;
    if (billingState.balanceCents < requiredCents) {
      $("#walletPanel").classList.add("open");
      showToast(`余额不足，本次预计需要 ${formatMoney(requiredCents)} 元`);
      renderWallet();
      return;
    }
  }
  state.lastOptions = options;
  activeGenerationLog = startGenerationLog(endpoint, options);

  isGenerating = true;
  setGenerating(true);
  startProgress("提交生成请求", "正在把提示词发送到中转接口", 8, { generated: 0, total: options.count });
  try {
    updateProgress("等待模型生成", `正在生成 ${options.count} 张图片`, 28, { generated: 0, total: options.count });
    const context = createGenerationContext(options);
    const images = await requestImageBatch(endpoint, options, context);
    const created = context.created;
    if (!created.length && !images.length) {
      throw new Error("没有成功生成图片，请稍后重试或降低生成数量");
    }
    updateProgress("整理结果", "正在确认已生成图片", 88, { generated: created.length, total: options.count });
    const suffix = created.length < options.count ? `，${options.count - created.length} 张未完成` : "";
    const finalStatus = generationCancelled ? "cancelled" : created.length >= options.count ? "completed" : "partial";
    const finalMessage = generationCancelled
      ? `已取消，保留 ${created.length}/${options.count} 张图片`
      : `已生成 ${created.length}/${options.count} 张图片${suffix}`;
    finishGenerationLog(finalStatus, {
      imageCount: created.length,
      message: finalMessage,
    });
    updateProgress(generationCancelled ? "生成已取消" : "生成完成", `${finalMessage}，用时 ${elapsedSeconds()} 秒`, 100, {
      generated: created.length,
      total: options.count,
    });
    showToast(finalMessage);
  } catch (error) {
    console.error(error);
    const cancelled = generationCancelled || isAbortError(error);
    const keptCount = state.results.filter((item) => item.generationId === generationId).length;
    const status = cancelled ? "cancelled" : keptCount ? "partial" : "failed";
    const message = cancelled
      ? keptCount
        ? `已取消，保留 ${keptCount}/${options.count} 张图片`
        : "已取消生成，没有可保留的图片"
      : keptCount
        ? `已保留 ${keptCount}/${options.count} 张图片，后续生成停止：${error.message || "生成失败"}`
        : error.message || "生成失败";
    finishGenerationLog(status, {
      error: status === "partial" ? "" : error.message || "生成失败",
      message: status === "partial" ? message : "",
      imageCount: keptCount,
    });
    updateProgress(cancelled ? "生成已取消" : keptCount ? "部分完成" : "生成失败", message, 100, {
      generated: keptCount,
      total: options.count,
    });
    showToast(message);
  } finally {
    setTimeout(() => {
      isGenerating = false;
      activeGenerationLog = null;
      generationAbortController = null;
      generationCancelled = false;
      setGenerating(false);
      hideProgress();
    }, 900);
  }
}

async function requestImages(endpoint, options) {
  endpoint = normalizeEndpointBeforeRequest(endpoint, options);
  const headers = {};
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  if (config.requestFormat === "json") {
    headers["Content-Type"] = "application/json";
    const body = renderTemplate(config.customTemplate || defaultTemplate, options);
    return sendAndParseImageRequest(endpoint, { method: "POST", headers, bodyType: "json", body, signal: options.abortSignal }, options, {
      variant: "custom-json",
      label: requestLogLabel(options),
    });
  }

  const variants = ["compatible", "minimal"];
  let lastError = null;

  for (const [variantIndex, variant] of variants.entries()) {
    try {
      const payload =
        options.mode === "text" || !options.referenceImages.length
          ? await requestTextImages(endpoint, headers, options, variant)
          : await requestEditImages(endpoint, headers, options, variant);
      if (normalizeImages(payload).length) return payload;
      lastError = new Error(`接口返回成功，但没有找到图片字段：${previewPayload(payload)}`);
      break;
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithMinimalPayload(cleanErrorMessage(error), variant, options)) break;
    }
  }

  throw lastError || new Error("生成失败：接口没有返回图片");
}

function normalizeEndpointBeforeRequest(endpoint, options) {
  if (options.mode !== "image" || !(options.referenceImages || []).length) return endpoint;
  const corrected = inferEditEndpoint(endpoint);
  return corrected || endpoint;
}

function resolveEndpointForMode(mode) {
  if (isPlatformApiSelected()) {
    return {
      endpoint: "/api/billing/platform-image",
      inferred: false,
      message: "",
    };
  }

  if (mode === "image") {
    const editEndpoint = (config.editEndpoint || "").trim();
    if (editEndpoint) {
      const corrected = inferEditEndpoint(editEndpoint);
      if (corrected && corrected !== editEndpoint) {
        config.editEndpoint = corrected;
        $("#editEndpoint").value = corrected;
        saveActiveConfig();
        return {
          endpoint: corrected,
          inferred: true,
          message: "图生图不能使用 /v1/images/generations，已自动改为 /v1/images/edits",
        };
      }
      return { endpoint: editEndpoint, inferred: false, message: "" };
    }

    const inferred = inferEditEndpoint(config.textEndpoint);
    if (inferred) {
      config.editEndpoint = inferred;
      $("#editEndpoint").value = inferred;
      saveActiveConfig();
      return {
        endpoint: inferred,
        inferred: true,
        message: "已自动使用 /v1/images/edits 作为图生图接口",
      };
    }

    return {
      endpoint: "",
      inferred: false,
      message: "图生图需要填写“图生图/编辑 API URL”，通常是 /v1/images/edits，不能使用 /v1/images/generations",
    };
  }

  const textEndpoint = (config.textEndpoint || "").trim();
  if (textEndpoint) {
    return { endpoint: textEndpoint, inferred: false, message: "" };
  }

  return {
    endpoint: "",
    inferred: false,
    message: "文生图需要填写“文生图 API URL”，通常是 /v1/images/generations",
  };
}

function inferEditEndpoint(textEndpoint) {
  const endpoint = (textEndpoint || "").trim();
  if (!endpoint) return "";
  try {
    const url = new URL(endpoint);
    if (/\/images\/edits\/?$/i.test(url.pathname)) return endpoint;
    if (/\/images\/generations\/?$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\/images\/generations\/?$/i, "/images/edits");
      return url.toString();
    }
  } catch {
    if (/\/images\/edits\/?([?#].*)?$/i.test(endpoint)) return endpoint;
    if (/\/images\/generations\/?([?#].*)?$/i.test(endpoint)) {
      return endpoint.replace(/\/images\/generations\/?(?=([?#]|$))/i, "/images/edits");
    }
  }
  return "";
}

async function requestTextImages(endpoint, headers, options, variant) {
  headers["Content-Type"] = "application/json";
  const body = buildImageJsonBody(options, variant);
  return sendAndParseImageRequest(
    endpoint,
    {
      method: "POST",
      headers,
      bodyType: "json",
      body: JSON.stringify(body),
      signal: options.abortSignal,
      billingCount: options.count,
      billingMode: options.mode,
      billingModel: options.model,
      billingGenerationId: options.generationId,
    },
    options,
    { variant, label: requestLogLabel(options) },
  );
}

async function requestEditImages(endpoint, headers, options, variant) {
  const fields = buildImageFormFields(options, variant);
  const files = options.referenceImages.map((image, index) => ({
    field: index === 0 ? "image" : `image_${index + 1}`,
    filename: image.name || `reference-${index + 1}.png`,
    dataUrl: image.dataUrl,
  }));

  return sendAndParseImageRequest(
    endpoint,
    {
      method: "POST",
      headers,
      bodyType: "multipart",
      fields,
      files,
      signal: options.abortSignal,
      billingCount: options.count,
      billingMode: options.mode,
      billingModel: options.model,
      billingGenerationId: options.generationId,
    },
    options,
    { variant, label: requestLogLabel(options) },
  );
}

function buildImageJsonBody(options, variant) {
  const body = {
    model: options.model,
    prompt: buildPrompt(options),
  };
  appendCompatibleImageFields(body, options, variant);
  return body;
}

function buildImageFormFields(options, variant) {
  const fields = {
    model: options.model,
    prompt: buildPrompt(options),
  };
  appendCompatibleImageFields(fields, options, variant);
  if (fields.n != null) fields.n = String(fields.n);
  if (fields.seed != null) fields.seed = String(fields.seed);
  return fields;
}

function appendCompatibleImageFields(target, options, variant) {
  if (variant !== "compatible") return;
  if (options.size && options.size !== "auto") target.size = options.size;
  if (options.count > 1) target.n = options.count;
  const quality = compatibleQuality(options);
  if (quality) target.quality = quality;
  if (options.seed) target.seed = Number.isFinite(Number(options.seed)) ? Number(options.seed) : options.seed;
}

function compatibleQuality(options) {
  const quality = options.quality || "";
  const model = options.model || "";
  if (quality === "hd" && /dall-e/i.test(model)) return "hd";
  if (quality === "high" && /gpt-image/i.test(model)) return "high";
  return "";
}

function createGenerationContext(options) {
  return {
    options,
    created: [],
    seenSources: new Set(),
  };
}

async function commitGeneratedImage(src, options, index, context) {
  if (!src || context?.seenSources?.has(src)) return null;
  context?.seenSources?.add(src);
  const result = await createResult(src, options, index);
  applyPlatformRequestCost(options, index);
  await chargePlatformImageIfNeeded(options, index, context);
  state.latestGenerationId = options.generationId || "";
  state.results.unshift(result);
  if (context) context.created.push(result);
  await persistState();
  renderResults();
  return result;
}

async function chargePlatformImageIfNeeded(options, index, context) {
  if (options.apiProvider !== "platform") return;
  const requestId = `${options.generationId || makeId()}:${index + 1}`;
  if (!context) return;
  context.chargedRequestIds ||= new Set();
  if (context.chargedRequestIds.has(requestId)) return;
  const response = await fetch("/api/billing/platform-usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId,
      generationId: options.generationId || "",
      imageCount: 1,
      mode: options.mode || "text",
      model: options.model || "",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `扣费失败：${response.status}`);
  }
  context.chargedRequestIds.add(requestId);
  if (Number.isFinite(Number(payload.balanceCents))) {
    billingState.balanceCents = Number(payload.balanceCents);
    renderWallet();
  }
  refreshBilling();
}

function applyPlatformRequestCost(options, index) {
  if (options.apiProvider !== "platform") return;
  const requestEntry = findRequestLogEntry(options, index);
  if (!requestEntry) return;
  const priceCents = resolvePlatformPriceCents(options);
  requestEntry.costCents = priceCents;
  if (activeGenerationLog) activeGenerationLog.costCents = totalGenerationLogCost(activeGenerationLog);
  saveGenerationLogs();
  renderGenerationLogs();
}

function resolvePlatformPriceCents(options = {}) {
  const configured = Number(
    options.platformPriceCents ??
      billingState.lastDirectConfig?.priceCents ??
      billingState.priceCents ??
      PLATFORM_PRICE_FALLBACK_CENTS,
  );
  return Math.max(0, Math.round(configured || 0));
}

function findRequestLogEntry(options, index) {
  const currentIndex = Number(options.batchIndex) || index + 1;
  const label = options.batchTotal > 1 ? `第 ${currentIndex}/${options.batchTotal} 张` : options.count > 1 ? `批量 ${options.count} 张` : "单图请求";
  const log = activeGenerationLog || generationLogs[0];
  if (!log?.requests?.length) return null;
  return [...log.requests].reverse().find((entry) => String(entry.label || "").startsWith(label)) || null;
}

async function commitGeneratedImages(sources, options, startIndex, context) {
  const created = [];
  for (const [index, src] of sources.entries()) {
    const result = await commitGeneratedImage(src, options, startIndex + index, context);
    if (result) created.push(result);
  }
  return created;
}

async function requestImageBatch(endpoint, options, context) {
  const desired = Math.max(1, options.count || 1);
  if (shouldUseSingleImageRequests(options, desired)) {
    updateProgress("逐张生成中", `正在精确生成 ${desired} 张图片`, 30, { generated: 0, total: desired });
    return requestSingleImages(endpoint, options, desired, 0, desired, context);
  }

  const title = desired > 1 ? "批量优先生成中" : "生成中";
  updateProgress(title, `正在请求生成 ${desired} 张图片`, 30, { generated: 0, total: desired });
  let images = [];
  try {
    const payload = await requestImages(endpoint, { ...options, count: desired, batchTotal: 0 });
    images = normalizeImages(payload).slice(0, desired);
    await commitGeneratedImages(images, options, 0, context);
    updateProgress("接收生成结果", `接口返回 ${images.length}/${desired} 张图片`, 82, { generated: images.length, total: desired });
    if (images.length < desired && desired > 1) {
      showToast(`批量请求返回 ${images.length}/${desired} 张，已停止自动补单以避免重复扣费`);
    }
    return images;
  } catch (error) {
    const message = cleanErrorMessage(error);
    if (desired === 1) throw error;
    updateProgress("批量请求已停止", `批量请求失败：${message}。已停止自动补单，避免重复扣费`, 100, {
      generated: 0,
      total: desired,
    });
    throw new Error(`批量请求失败，已停止自动补单以避免重复扣费：${message}`);
  }

  return images;
}

async function requestSingleImages(endpoint, options, desired, offset = 0, total = desired, context = null) {
  const tasks = Array.from({ length: desired }, (_, index) => index);
  const images = Array.from({ length: desired }, () => "");
  const errors = [];
  let completed = 0;
  const concurrency = getSingleRequestConcurrency(options, desired);
  const progressStart = Math.max(currentProgress, 36);
  const progressRange = Math.max(12, 82 - progressStart);

  await runLimited(tasks, concurrency, async (index) => {
    if (generationCancelled) return;
    const absoluteIndex = offset + index;
    let lastError = "";
    try {
      for (let attempt = 1; attempt <= SINGLE_IMAGE_MAX_ATTEMPTS && !generationCancelled; attempt += 1) {
        const oneOptions = {
          ...options,
          count: 1,
          seed: nextSeed(options.seed, absoluteIndex),
          batchIndex: absoluteIndex + 1,
          batchTotal: total,
          requestAttempt: attempt,
        };
        try {
          const payload = await requestImages(endpoint, oneOptions);
          const source = normalizeImages(payload)[0] || "";
          if (!source) throw new Error("接口没有返回图片");
          images[index] = source;
          await commitGeneratedImage(source, oneOptions, absoluteIndex, context);
          break;
        } catch (error) {
          lastError = cleanErrorMessage(error);
          if (generationCancelled || isAbortError(error) || attempt >= SINGLE_IMAGE_MAX_ATTEMPTS || !shouldRetrySingleImageError(lastError)) break;
          updateProgress("重试单张生成", `第 ${absoluteIndex + 1}/${total} 张失败：${lastError}，正在重试`, currentProgress, {
            generated: offset + images.filter(Boolean).length,
            total,
          });
          await wait(900);
        }
      }
      if (!images[index] && lastError) errors.push(`第 ${absoluteIndex + 1}/${total} 张：${lastError}`);
    } finally {
      completed += 1;
      const imageCount = images.filter(Boolean).length;
      updateProgress(
        "逐张生成中",
        `已生成 ${offset + imageCount}/${total} 张，已完成 ${completed}/${desired} 次请求`,
        progressStart + (completed / desired) * progressRange,
        { generated: offset + imageCount, total },
      );
    }
  });

  const collectedImages = images.filter(Boolean).slice(0, desired);
  if (!collectedImages.length && errors.length) {
    throw new Error(`生成失败：${errors[0]}`);
  }
  if (errors.length) {
    showToast(`部分请求失败：${errors[0]}`);
  }
  return collectedImages;
}

function getSingleRequestConcurrency() {
  return 1;
}

function shouldUseSingleImageRequests(options, desired) {
  if (desired <= PLATFORM_MAX_BATCH_REQUEST_COUNT) return false;
  return options.apiProvider === "platform" || options.multiImageMode === "single";
}

function isFatalImageError(message) {
  return /\b(401|403|429)\b|unauthorized|authentication|invalid api key|forbidden|permission|quota|billing|rate limit/i.test(
    message,
  );
}

function shouldRetrySingleImageError(message) {
  return (
    !isFatalImageError(message) &&
    /\b(500|502|503|504|520|522|524)\b|timeout|timed out|bad gateway|gateway|temporar|network|failed to fetch|没有返回图片|no image|internal_error|server_error|stream error|received from peer|rst_stream|reset/i.test(
      message,
    )
  );
}

function isUncertainChargedError(message) {
  return /failed to fetch|network|timeout|timed out|\b(504|524)\b|edgeone_proxy_timeout|代理等待上游生图超时|上游接口超时|请求超时|连接中断|connection|aborted/i.test(
    message || "",
  );
}

function shouldRetryWithMinimalPayload(message, variant, options = {}) {
  return (
    variant === "compatible" &&
    Number(options.count || 1) <= 1 &&
    !isFatalImageError(message) &&
    !isUncertainChargedError(message) &&
    /invalid|unsupported|not support|quality|size|seed|\bn\b|count|parameter|param/i.test(
      message,
    )
  );
}

function isAbortError(error) {
  return error?.name === "AbortError" || /abort|aborted|取消/i.test(error?.message || String(error));
}

async function sendAndParseImageRequest(endpoint, request, options, meta = {}) {
  const requestLog = startRequestLog(endpoint, request, options, meta);
  try {
    const response = await sendImageRequest(endpoint, request);
    const payload = await parseApiResponse(response, requestLog);
    if (isPlatformApiSelected()) refreshBilling();
    await recordApiUsage(endpoint, options, requestLog, {
      status: requestLog?.status === "success" ? "success" : "failed",
      error: requestLog?.error || (requestLog?.status === "no-image" ? "接口返回成功，但没有图片数据" : ""),
    });
    return payload;
  } catch (error) {
    completeRequestLog(requestLog, {
      status: "failed",
      error: error.message || String(error),
    });
    if (isPlatformApiSelected()) refreshBilling();
    await recordApiUsage(endpoint, options, requestLog, { status: "failed", error: error.message || String(error) });
    throw error;
  }
}

async function sendImageRequest(endpoint, request) {
  if (isPlatformApiSelected()) {
    return fetchPlatformDirectImageRequest(endpoint, request);
  }

  if (config.transportMode === "direct") {
    return fetchDirectImageRequest(endpoint, request);
  }

  const { signal, ...proxyRequest } = request;
  const proxyResponse = await fetch("/api/proxy-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, request: proxyRequest }),
    signal,
  });
  if (shouldFallbackToDirect(proxyResponse)) {
    showToast("线上代理超时，正在尝试浏览器直连");
    return fetchDirectImageRequest(endpoint, request);
  }
  return proxyResponse;
}

async function fetchPlatformDirectImageRequest(endpoint, request) {
  const { signal, billingCount, billingMode, billingModel } = request;
  const platform = await readPlatformDirectConfig({
    signal,
    mode: billingMode || $("#modeSelect").value,
    count: billingCount || 1,
    model: billingModel || getModelName(),
  });
  billingState.lastDirectConfig = platform;
  const directRequest = {
    ...request,
    headers: {
      ...sanitizePlatformBrowserHeaders(request.headers || {}),
      Authorization: `Bearer ${platform.apiKey}`,
    },
  };
  return fetchDirectImageRequest(platform.endpoint || endpoint, directRequest);
}

async function readPlatformDirectConfig({ signal, mode, count, model }) {
  const configResponse = await fetch("/api/billing/platform-direct-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, count, model }),
    signal,
  });
  const platform = await configResponse.json().catch(() => ({}));
  if (!configResponse.ok) {
    throw new Error(platform?.error?.message || platform?.message || `推荐 API 配置读取失败：${configResponse.status}`);
  }
  return platform || {};
}

function fetchDirectImageRequest(endpoint, request) {
  if (request.bodyType === "multipart") {
    const form = new FormData();
    Object.entries(request.fields).forEach(([key, value]) => form.append(key, value));
    request.files.forEach((file) => form.append(file.field, dataUrlToBlob(file.dataUrl), file.filename));
    return fetch(endpoint, { method: request.method, headers: request.headers, body: form, signal: request.signal });
  }
  return fetch(endpoint, { method: request.method, headers: request.headers, body: request.body, signal: request.signal });
}

function sanitizePlatformBrowserHeaders(headers) {
  const clean = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    if (key.toLowerCase() !== "content-type") return;
    clean[key] = String(value);
  });
  return clean;
}

function shouldFallbackToDirect(response) {
  if (config.transportMode !== "proxy") return false;
  const contentType = response.headers.get("content-type") || "";
  return response.status === 504 && /text\/html|text\/plain/i.test(contentType);
}

async function parseApiResponse(response, requestLog = null) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const payload = { data: [{ url: await blobToDataUrl(await response.blob()) }] };
    completeRequestLog(requestLog, {
      status: response.ok ? "success" : "failed",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount: 1,
      responsePreview: `Binary image response: ${contentType}`,
    });
    return payload;
  }
  if (response.ok && isBinaryImageResponse(contentType)) {
    const payload = { data: [{ url: await blobToDataUrl(await response.blob()) }] };
    completeRequestLog(requestLog, {
      status: "success",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount: 1,
      responsePreview: `Binary image response: ${contentType}`,
    });
    return payload;
  }
  const text = await response.text();
  let payload = text;
  let parsedJson = false;
  try {
    payload = JSON.parse(text);
    parsedJson = true;
  } catch {
    if (!response.ok) {
      const message = formatHttpError(response.status, text);
      completeRequestLog(requestLog, {
        status: "failed",
        httpStatus: response.status,
        ok: response.ok,
        contentType,
        imageCount: 0,
        responsePreview: summarizeLogValue(text),
        error: message,
      });
      throw new Error(message);
    }
  }
  const imageCount = normalizeImages(payload).length;
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || text || `请求失败：${response.status}`;
    const formatted = formatHttpError(response.status, message);
    completeRequestLog(requestLog, {
      status: "failed",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount,
      responsePreview: summarizeLogValue(parsedJson ? payload : text),
      error: formatted,
    });
    throw new Error(formatted);
  }
  const embeddedError = payload?.error || payload?.message;
  if (embeddedError && !imageCount) {
    const formatted = formatHttpError(response.status, embeddedError);
    completeRequestLog(requestLog, {
      status: "failed",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount,
      responsePreview: summarizeLogValue(parsedJson ? payload : text),
      error: formatted,
    });
    throw new Error(formatted);
  }
  completeRequestLog(requestLog, {
    status: imageCount ? "success" : "no-image",
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    imageCount,
    responsePreview: summarizeLogValue(parsedJson ? payload : text),
  });
  return payload;
}

function isBinaryImageResponse(contentType) {
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  return ["application/octet-stream", "binary/octet-stream"].includes(normalized);
}

async function runLimited(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function cleanErrorMessage(error) {
  return formatHttpError(0, error?.message || String(error));
}

function formatHttpError(status, message) {
  const rawText = typeof message === "object" ? JSON.stringify(message) : String(message || "");
  const text = rawText.replace(/\s+/g, " ").trim();
  const code = text.match(/Error code\s*(\d{3})/i)?.[1] || (status ? String(status) : "");
  const title = text.match(/<title>(.*?)<\/title>/i)?.[1];
  if (/openai_error|bad_response_status_code/i.test(text)) {
    return "API 返回 openai_error，响应里没有图片数据。网页无法取回已在上游生成但未返回的图片，已停止自动补单以避免重复扣费。";
  }
  if (code === "524" || /524: A timeout occurred|A timeout occurred/i.test(text)) {
    return "上游接口超时（Cloudflare 524）。本次没有自动追加请求，请减少数量或稍后重试。";
  }
  if (code === "504" && /EdgeOne Pages/i.test(text)) {
    return "EdgeOne 代理函数超时或未生效。已尝试直连；如果仍失败，请在设置里切到“浏览器直连”或降低生成数量。";
  }
  if (/<!doctype html|<html[\s>]/i.test(text)) {
    return title ? `接口返回 HTML：${title}` : "接口返回 HTML 页面，请检查 API URL 是否为真实接口路径";
  }
  return text.slice(0, 260) || `请求失败${code ? `：${code}` : ""}`;
}

function normalizeImages(payload) {
  const images = [];
  collectImages(payload, images, new Set(), 0, "");
  return images;
}

function collectImages(value, images, seen, depth, keyPath) {
  if (value == null || depth > 8) return;

  if (typeof value === "string") {
    const parsed = tryParseJsonValue(value);
    if (parsed != null && typeof parsed !== "string") {
      collectImages(parsed, images, seen, depth + 1, keyPath);
      return;
    }

    for (const source of normalizeImageSources(value, keyPath)) {
      if (source && !seen.has(source)) {
        seen.add(source);
        images.push(source);
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImages(item, images, seen, depth + 1, `${keyPath}[${index}]`));
    return;
  }

  if (typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    collectImages(nested, images, seen, depth + 1, keyPath ? `${keyPath}.${key}` : key);
  }
}

function normalizeImageSource(source, keyPath = "") {
  return normalizeImageSources(source, keyPath)[0] || "";
}

function normalizeImageSources(source, keyPath = "") {
  const value = String(source || "").trim();
  if (!value || looksLikeHtml(value)) return [];
  const imageField = isImageFieldKeyPath(keyPath);
  const sources = [];
  const addSource = (candidate) => {
    const clean = cleanImageSource(candidate);
    if (clean && !sources.includes(clean)) sources.push(clean);
  };

  const parsedString = tryParseJsonString(value);
  if (parsedString && parsedString !== value) return normalizeImageSources(parsedString, keyPath);

  if (value.startsWith("data:image/")) addSource(value);

  const dataUrls = value.match(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+/gi) || [];
  dataUrls.forEach((dataUrl) => addSource(dataUrl.replace(/\s/g, "")));

  const markdownUrls = [...value.matchAll(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi)].map((match) => match[1]);
  markdownUrls.forEach((url) => {
    if (isLikelyImageUrl(url)) addSource(url);
  });

  const urls = value.match(/https?:\/\/[^\s"'<>),]+/gi) || [];
  urls.forEach((url) => {
    if (isLikelyImageUrl(url) || (imageField && !isExcludedImageUrl(url))) addSource(url);
  });

  const imageBase64 = value.match(/[A-Za-z0-9+/_-]{220,}={0,2}/)?.[0];
  if (imageBase64 && imageField && !dataUrls.length) {
    const imageBase64Items = value.match(/[A-Za-z0-9+/_-]{220,}={0,2}/g) || [];
    imageBase64Items.forEach((item) => {
      addSource(`data:image/png;base64,${item.replace(/-/g, "+").replace(/_/g, "/")}`);
    });
  }
  return sources;
}

function cleanImageSource(source) {
  const value = String(source || "").trim();
  if (value.startsWith("data:image/")) return value.replace(/\s/g, "");
  return value.replace(/[.。]+$/, "");
}

function isLikelyImageUrl(url) {
  const clean = url.replace(/[.。]$/, "");
  if (isExcludedImageUrl(clean)) return false;
  if (/\.(png|jpe?g|webp|gif|bmp|avif)(\?|#|$)/i.test(clean)) return true;
  if (/[?&](format|type|mime)=image/i.test(clean)) return true;
  if (/\/(generated|generations|image|images|file|files|asset|assets|download|output|result)\b/i.test(clean)) return true;
  return false;
}

function isExcludedImageUrl(url) {
  return /logo|favicon|avatar|icon|brand/i.test(url);
}

function isImageFieldKeyPath(keyPath) {
  return /(^|[^a-z0-9])(b64|b64_json|base64|image|image_url|images|img|data|url|result|output|content|asset|assets|file|files|download)($|[^a-z0-9])/i.test(
    keyPath,
  );
}

function isHtmlPayload(payload) {
  return typeof payload === "string" && looksLikeHtml(payload);
}

function looksLikeHtml(value) {
  return /<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(value);
}

function buildPrompt(options) {
  const batchHint = options.batchTotal > 1 ? `Variation ${options.batchIndex} of ${options.batchTotal}.` : "";
  return [options.prompt, batchHint, options.negativePrompt ? `Negative prompt: ${options.negativePrompt}` : ""].filter(Boolean).join("\n");
}

function renderTemplate(template, options) {
  const values = {
    model: options.model,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt,
    ratio: options.ratio,
    size: options.size,
    count: options.count,
    quality: options.quality,
    seed: options.seed || "",
    referenceImages: JSON.stringify(options.referenceImages.map((image) => image.dataUrl)),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = values[key] ?? "";
    if (key === "count" || key === "referenceImages") return value;
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  });
}

function nextSeed(seed, offset) {
  if (!seed) return "";
  const numeric = Number(seed);
  return Number.isFinite(numeric) ? String(numeric + offset) : `${seed}-${offset}`;
}

async function createResult(src, options, index) {
  const [savedSrc, dimensions] = await Promise.all([persistableImageSource(src), getImageDimensionsSafe(src)]);
  return {
    id: makeId(),
    src: savedSrc,
    prompt: options.prompt,
    model: options.model,
    size: options.size,
    quality: options.quality,
    generationId: options.generationId || "",
    createdAt: Date.now() + index,
    width: dimensions.width,
    height: dimensions.height,
  };
}

function renderResults() {
  const grid = $("#resultGrid");
  $("#resultMeta").textContent = state.results.length ? `${state.results.length} 张图片` : "生成后的图片会排列在这里";

  if (!state.results.length) {
    grid.className = "result-grid empty";
    grid.innerHTML = `<div class="empty-state"><h3>还没有图片</h3><p>在底部输入提示词，上传参考图，选择模型和质量，然后生成。</p></div>`;
    return;
  }

  grid.className = "result-grid";
  grid.innerHTML = "";
  state.results.forEach((item) => {
    const isNew = Boolean(item.generationId && item.generationId === state.latestGenerationId);
    const card = document.createElement("article");
    card.className = `image-card${isNew ? " is-new" : ""}`;
    card.dataset.width = String(item.width || 1);
    card.dataset.height = String(item.height || 1);
    card.style.setProperty("--ratio", `${item.width || 1} / ${item.height || 1}`);
    card.innerHTML = `
      <img src="${item.src}" alt="${escapeHtml(item.prompt)}" />
      ${isNew ? '<span class="new-badge" title="本次新生成">新</span>' : ""}
      <div class="card-overlay">
        <span class="card-prompt">${escapeHtml(item.prompt)}</span>
        <div class="card-actions">
          <button type="button" data-action="edit" title="编辑"><i data-icon="sparkles"></i></button>
          <button type="button" data-action="reuse" title="回填提示词"><i data-icon="rotate"></i></button>
          <button type="button" data-action="download" title="下载"><i data-icon="download"></i></button>
          <button type="button" data-action="delete" title="删除"><i data-icon="trash"></i></button>
        </div>
      </div>
    `;
    const image = card.querySelector("img");
    image.addEventListener("load", layoutResultMasonry, { once: true });
    image.addEventListener("click", () => openDetail(item.id));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openDetail(item.id));
    card.querySelector('[data-action="reuse"]').addEventListener("click", () => reusePrompt(item.prompt));
    card.querySelector('[data-action="download"]').addEventListener("click", () => downloadImage(item.src, fileNameFor(item)));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteResult(item.id));
    grid.appendChild(card);
  });
  renderIcons();
  layoutResultMasonry();
}

function layoutResultMasonry() {
  const grid = $("#resultGrid");
  if (!grid || grid.classList.contains("empty")) return;

  const styles = getComputedStyle(grid);
  const rowHeight = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 8;
  const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0;
  $$(".image-card").forEach((card) => {
    const image = card.querySelector("img");
    if (!image) return;

    const imageWidth = image.naturalWidth || Number(card.dataset.width) || 1;
    const imageHeight = image.naturalHeight || Number(card.dataset.height) || 1;
    const renderedWidth = card.getBoundingClientRect().width || 1;
    const targetHeight = (renderedWidth * imageHeight) / imageWidth;
    const rowSpan = Math.max(1, Math.ceil((targetHeight + rowGap) / (rowHeight + rowGap)));
    card.style.gridRowEnd = `span ${rowSpan}`;
  });
}

function debounce(callback, delay = 100) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

function openDetail(id) {
  const item = state.results.find((result) => result.id === id);
  if (!item) return;
  state.selectedResultId = id;
  const detailImage = $("#detailImage");
  detailImage.onload = resetDetailView;
  detailImage.src = item.src;
  $("#detailThumb").src = item.src;
  $("#detailTitle").textContent = item.model || "图片编辑";
  $("#detailPrompt").textContent = item.prompt;
  $("#detailInfo").textContent = `${item.size || ""} · ${item.quality || ""}`;
  $("#editPromptInput").value = "";
  $("#detailModal").hidden = false;
  resetDetailView();
  if (detailImage.complete) resetDetailView();
}

function closeDetail() {
  $("#detailModal").hidden = true;
  detailView.dragging = false;
  $("#detailViewport").classList.remove("is-dragging");
  resetDetailView();
}

function onDetailWheel(event) {
  if ($("#detailModal").hidden) return;
  event.preventDefault();
  const viewport = $("#detailViewport");
  const rect = viewport.getBoundingClientRect();
  const pointX = event.clientX - rect.left - rect.width / 2;
  const pointY = event.clientY - rect.top - rect.height / 2;
  const nextScale = clamp(detailView.scale * Math.exp(-event.deltaY * 0.0014), 1, 7);
  const zoomRatio = nextScale / detailView.scale;

  detailView.x = pointX - (pointX - detailView.x) * zoomRatio;
  detailView.y = pointY - (pointY - detailView.y) * zoomRatio;
  detailView.scale = nextScale;
  clampDetailPan();
  applyDetailTransform();
}

function onDetailPointerDown(event) {
  if ($("#detailModal").hidden || event.button !== 0 || detailView.scale <= 1.01) return;
  detailView.dragging = true;
  detailView.startX = event.clientX;
  detailView.startY = event.clientY;
  detailView.startPanX = detailView.x;
  detailView.startPanY = detailView.y;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.currentTarget.classList.add("is-dragging");
}

function onDetailPointerMove(event) {
  if (!detailView.dragging) return;
  detailView.x = detailView.startPanX + event.clientX - detailView.startX;
  detailView.y = detailView.startPanY + event.clientY - detailView.startY;
  clampDetailPan();
  applyDetailTransform();
}

function onDetailPointerUp() {
  if (!detailView.dragging) return;
  detailView.dragging = false;
  $("#detailViewport").classList.remove("is-dragging");
}

function onGlobalKeyDown(event) {
  if (event.key === "Escape" && !$("#detailModal").hidden) closeDetail();
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  const key = event.key.toLowerCase();
  statsOpenBuffer = `${statsOpenBuffer}${key}`.slice(-API_STATS_OPEN_PHRASE.length);
  codeAdminOpenBuffer = `${codeAdminOpenBuffer}${key}`.slice(-CODE_ADMIN_OPEN_PHRASE.length);
  if (statsOpenBuffer === API_STATS_OPEN_PHRASE) {
    event.preventDefault();
    statsOpenBuffer = "";
    removeOpenPhraseFromActiveField(API_STATS_OPEN_PHRASE);
    openStatsPanelWithPassword();
  } else if (codeAdminOpenBuffer === CODE_ADMIN_OPEN_PHRASE) {
    event.preventDefault();
    codeAdminOpenBuffer = "";
    removeOpenPhraseFromActiveField(CODE_ADMIN_OPEN_PHRASE);
    openCodeAdminPanel();
  }
}

function removeOpenPhraseFromActiveField(phrase) {
  const field = document.activeElement;
  if (!field || !["INPUT", "TEXTAREA"].includes(field.tagName || "")) return;
  const value = field.value || "";
  if (!value.toLowerCase().endsWith(phrase)) return;
  field.value = value.slice(0, -phrase.length);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

async function openStatsPanelWithPassword() {
  const password = prompt("请输入管理员密码");
  if (password == null) return;
  const response = await fetch("/api/billing/admin/platform", {
    headers: { "X-Admin-Password": password },
  });
  if (!response.ok) {
    showToast("管理员密码不正确");
    return;
  }
  renderApiStats();
  $("#statsPanel").classList.add("open");
}

function resetDetailView() {
  detailView.scale = 1;
  detailView.x = 0;
  detailView.y = 0;
  applyDetailTransform();
}

function applyDetailTransform() {
  const image = $("#detailImage");
  const viewport = $("#detailViewport");
  if (!image || !viewport) return;
  image.style.transform = `translate3d(${detailView.x}px, ${detailView.y}px, 0) scale(${detailView.scale})`;
  viewport.classList.toggle("is-zoomed", detailView.scale > 1.01);
}

function clampDetailPan() {
  const viewport = $("#detailViewport");
  const image = $("#detailImage");
  if (!viewport || !image || detailView.scale <= 1.01) {
    detailView.x = 0;
    detailView.y = 0;
    return;
  }

  const maxX = Math.max(0, (image.clientWidth * detailView.scale - viewport.clientWidth) / 2 + 36);
  const maxY = Math.max(0, (image.clientHeight * detailView.scale - viewport.clientHeight) / 2 + 36);
  detailView.x = clamp(detailView.x, -maxX, maxX);
  detailView.y = clamp(detailView.y, -maxY, maxY);
}

function generateFromDetail() {
  const item = selectedResult();
  if (!item) return;
  state.references = [{ id: item.id, name: fileNameFor(item), dataUrl: item.src }];
  renderReferences();
  const editPrompt = $("#editPromptInput").value.trim();
  $("#promptInput").value = editPrompt || item.prompt;
  autoGrow($("#promptInput"));
  $("#modeSelect").value = "image";
  closeDetail();
  generateImages({ mode: "image", prompt: $("#promptInput").value });
}

function selectedResult() {
  return state.results.find((item) => item.id === state.selectedResultId);
}

function downloadSelected() {
  const item = selectedResult();
  if (item) downloadImage(item.src, fileNameFor(item));
}

function deleteSelected() {
  const item = selectedResult();
  if (item) deleteResult(item.id);
  closeDetail();
}

async function deleteResult(id) {
  state.results = state.results.filter((item) => item.id !== id);
  if (state.selectedResultId === id) state.selectedResultId = "";
  await persistState();
  renderResults();
  showToast("图片已删除");
}

function reuseSelectedPrompt() {
  const item = selectedResult();
  if (item) reusePrompt(item.prompt);
}

function reusePrompt(prompt) {
  $("#promptInput").value = prompt;
  autoGrow($("#promptInput"));
  closeDetail();
  $("#promptInput").focus();
  showToast("提示词已回填");
}

async function onReferenceFiles(event) {
  const files = [...event.target.files].filter((file) => file.type.startsWith("image/"));
  for (const file of files) {
    state.references.push({ id: makeId(), name: file.name, dataUrl: await fileToDataUrl(file) });
  }
  event.target.value = "";
  $("#modeSelect").value = state.references.length ? "image" : "text";
  renderReferences();
  await persistState();
}

function renderReferences() {
  const strip = $("#referenceStrip");
  strip.hidden = !state.references.length;
  strip.innerHTML = "";
  state.references.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "reference-chip";
    chip.innerHTML = `<img src="${item.dataUrl}" alt="${escapeHtml(item.name)}" /><button type="button" title="移除"><i data-icon="x"></i></button>`;
    chip.querySelector("button").addEventListener("click", async () => {
      state.references = state.references.filter((ref) => ref.id !== item.id);
      if (!state.references.length) $("#modeSelect").value = "text";
      renderReferences();
      await persistState();
    });
    strip.appendChild(chip);
  });
  renderIcons();
}

async function clearResults() {
  state.results = [];
  state.latestGenerationId = "";
  await persistState();
  renderResults();
}

function syncSizeOptions() {
  const preset = ratioPresets.find((item) => item.value === $("#ratioSelect").value) || ratioPresets[0];
  $("#sizeSelect").innerHTML = preset.sizes.map((size) => optionHtml(size, size)).join("");
}

function getModelName() {
  const value = $("#modelName").value;
  return value === "custom" ? config.modelName || "gpt-image-2" : value;
}

function loadConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    Object.assign(config, saved);
    if (Number(saved.configVersion || 1) < CONFIG_VERSION) {
      if (saved.transportMode === "proxy") config.transportMode = "direct";
      if (!saved.modelName || saved.modelName === "gpt-image-1") config.modelName = "gpt-image-2";
    }
    if (!saved.rememberKey) config.apiKey = "";
    if (saved.modelName) ensureModelOption(saved.modelName);
  } catch {
    showToast("配置读取失败");
  }
}

function hydrateConfig() {
  $("#textEndpoint").value = config.textEndpoint || "";
  $("#editEndpoint").value = config.editEndpoint || "";
  $("#apiKey").value = config.apiKey || "";
  $("#rememberKey").checked = Boolean(config.rememberKey);
  $("#requestFormat").value = config.requestFormat || "openai";
  $("#transportMode").value = config.transportMode || "direct";
  $("#multiImageMode").value = config.multiImageMode || "single";
  $("#apiProviderSelect").value = config.apiProvider || "platform";
  $("#customTemplate").value = config.customTemplate || defaultTemplate;
  ensureModelOption(config.modelName || "gpt-image-2");
  $("#modelName").value = config.modelName || "gpt-image-2";
  updateTemplateVisibility();
  updateApiProviderUi();
}

function saveConfigFromForm() {
  config.textEndpoint = $("#textEndpoint").value.trim();
  config.editEndpoint = $("#editEndpoint").value.trim();
  normalizeConfiguredEditEndpoint();
  config.apiKey = $("#apiKey").value.trim();
  config.rememberKey = $("#rememberKey").checked;
  config.requestFormat = $("#requestFormat").value;
  config.transportMode = $("#transportMode").value;
  config.multiImageMode = $("#multiImageMode").value;
  config.apiProvider = $("#apiProviderSelect").value;
  config.customTemplate = $("#customTemplate").value.trim() || defaultTemplate;
  config.modelName = getModelName();
  delete config.id;
  delete config.title;
  delete config.updatedAt;
  saveActiveConfig();
  rememberConfigSnapshot(config);
  renderConfigHistory();
  showToast("配置已保存");
}

function normalizeConfiguredEditEndpoint() {
  const corrected = inferEditEndpoint(config.editEndpoint);
  if (corrected && corrected !== config.editEndpoint) {
    config.editEndpoint = corrected;
    $("#editEndpoint").value = corrected;
  }
}

function saveMultiImageMode() {
  config.multiImageMode = $("#multiImageMode").value;
  saveActiveConfig();
}

function onApiProviderChange() {
  config.apiProvider = $("#apiProviderSelect").value;
  saveActiveConfig();
  updateApiProviderUi();
  if (isPlatformApiSelected()) refreshBilling();
}

function loadConfigHistory() {
  try {
    configHistory = normalizeConfigHistory(JSON.parse(localStorage.getItem(CONFIG_HISTORY_KEY) || "[]"));
  } catch {
    configHistory = [];
  }
}

function saveActiveConfig() {
  const persisted = {
    textEndpoint: config.textEndpoint || "",
    editEndpoint: config.editEndpoint || "",
    apiKey: config.rememberKey ? config.apiKey || "" : "",
    rememberKey: Boolean(config.rememberKey),
    requestFormat: config.requestFormat || "openai",
    transportMode: config.transportMode || "direct",
    multiImageMode: config.multiImageMode || "single",
    apiProvider: config.apiProvider || "platform",
    customTemplate: config.customTemplate || defaultTemplate,
    modelName: config.modelName || "gpt-image-2",
    configVersion: CONFIG_VERSION,
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(persisted));
}

function rememberConfigSnapshot(snapshot) {
  const item = sanitizeConfigSnapshot(snapshot);
  if (!item.textEndpoint && !item.editEndpoint && !item.apiKey) return;

  const key = configHistoryKey(item);
  configHistory = [item, ...configHistory.filter((entry) => configHistoryKey(entry) !== key)].slice(0, CONFIG_HISTORY_LIMIT);
  localStorage.setItem(CONFIG_HISTORY_KEY, JSON.stringify(configHistory));
}

function sanitizeConfigSnapshot(snapshot) {
  return {
    id: snapshot.id || makeId(),
    title: configSnapshotTitle(snapshot),
    textEndpoint: snapshot.textEndpoint || "",
    editEndpoint: snapshot.editEndpoint || "",
    apiKey: snapshot.rememberKey ? snapshot.apiKey || "" : "",
    rememberKey: Boolean(snapshot.rememberKey),
    requestFormat: snapshot.requestFormat || "openai",
    transportMode: snapshot.transportMode || "direct",
    multiImageMode: snapshot.multiImageMode || "single",
    apiProvider: snapshot.apiProvider || "platform",
    customTemplate: snapshot.customTemplate || defaultTemplate,
    modelName: snapshot.modelName || "gpt-image-2",
    updatedAt: Number(snapshot.updatedAt) || Date.now(),
  };
}

function normalizeConfigHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => sanitizeConfigSnapshot(entry || {}))
    .filter((entry) => entry.textEndpoint || entry.editEndpoint || entry.apiKey)
    .slice(0, CONFIG_HISTORY_LIMIT);
}

function configHistoryKey(item) {
  return [
    item.textEndpoint,
    item.editEndpoint,
    fingerprintApiKeySync(item.apiKey),
    item.requestFormat,
    item.transportMode,
    item.multiImageMode,
    item.apiProvider,
    item.modelName,
  ].join("|");
}

function configSnapshotTitle(snapshot) {
  const endpoint = snapshot.textEndpoint || snapshot.editEndpoint || "";
  try {
    return endpoint ? new URL(endpoint).host : snapshot.modelName || "API Config";
  } catch {
    return endpoint.replace(/^https?:\/\//i, "").split("/")[0] || snapshot.modelName || "API Config";
  }
}

function renderConfigHistory() {
  const list = $("#configHistoryList");
  if (!list) return;

  if (!configHistory.length) {
    list.innerHTML = `<div class="config-history-empty">保存配置后会显示在这里</div>`;
    return;
  }

  list.innerHTML = configHistory
    .map((item) => {
      const endpoint = item.textEndpoint || item.editEndpoint || "未设置 URL";
      const keyLabel = item.apiKey ? maskApiKey(item.apiKey) : "未保存 Key";
      const transportLabel = item.transportMode === "direct" ? "直连" : "代理";
      const multiLabel = item.multiImageMode === "batch" ? "单次批量" : "逐张稳定";
      return `
        <div class="config-history-item" data-config-id="${escapeHtml(item.id)}">
          <button class="config-history-main" type="button" data-action="switch-config">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(endpoint)}</span>
            <small>${escapeHtml(item.modelName || "gpt-image-2")} · ${escapeHtml(item.requestFormat || "openai")} · ${transportLabel} · ${multiLabel} · ${keyLabel}</small>
          </button>
          <button class="icon-button config-history-delete" type="button" data-action="delete-config" title="删除配置">
            <i data-icon="trash"></i>
          </button>
        </div>
      `;
    })
    .join("");
  renderIcons();
}

function onConfigHistoryClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const item = event.target.closest("[data-config-id]");
  if (!action || !item) return;

  if (action === "switch-config") {
    switchConfigHistory(item.dataset.configId);
  } else if (action === "delete-config") {
    deleteConfigHistory(item.dataset.configId);
  }
}

function switchConfigHistory(id) {
  const item = configHistory.find((entry) => entry.id === id);
  if (!item) return;

  Object.assign(config, item);
  normalizeConfiguredEditEndpoint();
  ensureModelOption(config.modelName || "gpt-image-2");
  hydrateConfig();
  saveActiveConfig();
  showToast("已切换 API 配置");
}

function deleteConfigHistory(id) {
  configHistory = configHistory.filter((entry) => entry.id !== id);
  localStorage.setItem(CONFIG_HISTORY_KEY, JSON.stringify(configHistory));
  renderConfigHistory();
  showToast("已删除历史配置");
}

async function loadBilling() {
  try {
    const [configResponse, meResponse] = await Promise.all([fetch("/api/billing/config"), fetch("/api/billing/me")]);
    if (configResponse.ok) {
      const info = await configResponse.json();
      billingState.priceCents = Number(info.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
      billingState.upstreamCostCents = Number(info.upstreamCostCents || billingState.upstreamCostCents || 0);
      billingState.platformEnabled = Boolean(info.platformEnabled);
    }
    if (meResponse.ok) applyBillingDashboard(await meResponse.json());
  } catch (error) {
    console.warn("充值信息读取失败", error);
  }
}

async function refreshBilling() {
  try {
    const response = await fetch("/api/billing/me");
    if (!response.ok) return;
    applyBillingDashboard(await response.json());
    renderWallet();
  } catch (error) {
    console.warn("余额刷新失败", error);
  }
}

function applyBillingDashboard(payload) {
  billingState.customerId = payload.customerId || payload.customer?.id || billingState.customerId;
  billingState.balanceCents = Number(payload.customer?.balanceCents || 0);
  billingState.orders = Array.isArray(payload.orders) ? payload.orders : [];
  billingState.usage = Array.isArray(payload.usage) ? payload.usage : [];
  billingState.redemptions = Array.isArray(payload.redemptions) ? payload.redemptions : [];
  billingState.priceCents = Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
  billingState.upstreamCostCents = Number(payload.upstreamCostCents || billingState.upstreamCostCents || 0);
  billingState.lastDirectConfig = {
    ...(billingState.lastDirectConfig || {}),
    priceCents: billingState.priceCents,
  };
}

function renderWallet() {
  $("#walletBalance").textContent = `余额 ${formatMoney(billingState.balanceCents)} 元`;
  $("#walletPanelBalance").textContent = `${formatMoney(billingState.balanceCents)} 元`;
  $("#walletPrice").textContent = formatPlatformPriceLabel(billingState.priceCents);
  updateRecommendedApiLabels();
  $("#walletCustomerId").textContent = billingState.customerId ? `用户 ${billingState.customerId.slice(-8)}` : "";
  renderRedemptionList();
  renderUsageList();
}

function renderUsageList() {
  const list = $("#usageList");
  if (!billingState.usage.length) {
    list.innerHTML = `<div class="log-empty">还没有扣费记录。</div>`;
    return;
  }
  list.innerHTML = billingState.usage
    .map(
      (item) => `
        <article class="wallet-item">
          <div>
            <strong>-${formatMoney(item.amountCents)} 元</strong>
            <span>${Number(item.imageCount || 0)} 张 · ${escapeHtml(modeLabel(item.mode))}</span>
          </div>
          <small>${escapeHtml(item.model || "-")} · ${formatWalletTime(item.createdAt)}</small>
        </article>
      `,
    )
    .join("");
}

function renderRedemptionList() {
  const list = $("#redemptionList");
  if (!billingState.redemptions.length) {
    list.innerHTML = `<div class="log-empty">还没有兑换记录。</div>`;
    return;
  }
  list.innerHTML = billingState.redemptions
    .map(
      (item) => `
        <article class="wallet-item">
          <div>
            <strong>+${formatMoney(item.amountCents)} 元</strong>
            <span>${escapeHtml(item.label || "兑换码充值")}</span>
          </div>
          <small>${escapeHtml(item.code || "-")} · ${formatWalletTime(item.createdAt)}</small>
        </article>
      `,
    )
    .join("");
}

async function redeemCode() {
  const code = $("#redeemCodeInput").value.trim();
  if (!code) {
    showToast("请输入兑换码");
    return;
  }
  try {
    const response = await fetch("/api/billing/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "兑换失败");
    $("#redeemCodeInput").value = "";
    await refreshBilling();
    showToast(`兑换成功，已到账 ${formatMoney(payload.redemption?.amountCents || 0)} 元`);
  } catch (error) {
    showToast(error.message || "兑换失败");
  }
}

function openCodeAdminPanel() {
  const savedPassword = localStorage.getItem(CODE_ADMIN_PASSWORD_KEY) || "";
  $("#codeAdminPassword").value = savedPassword;
  syncCodeAdminLabel();
  hydratePlatformAdminPriceDefaults();
  $("#codeAdminPanel").classList.add("open");
  $("#walletPanel").classList.remove("open");
  $("#settingsPanel").classList.remove("open");
  $("#logsPanel").classList.remove("open");
  $("#statsPanel").classList.remove("open");
  setTimeout(() => $("#codeAdminPassword")?.focus(), 0);
  if (savedPassword) loadPlatformAdminConfig({ silent: true });
}

function syncCodeAdminLabel() {
  const amount = Number($("#codeAdminAmount")?.value || 0);
  const label = $("#codeAdminLabel");
  if (!label || document.activeElement === label) return;
  label.value = amount > 0 ? `${formatCodeAdminAmount(amount)}元充值码` : "充值码";
}

async function generateRedeemCodesFromPanel() {
  const password = $("#codeAdminPassword").value.trim();
  const amountYuan = Number($("#codeAdminAmount").value || 0);
  const count = Math.floor(Number($("#codeAdminCount").value || 0));
  const label = $("#codeAdminLabel").value.trim() || `${formatCodeAdminAmount(amountYuan)}元充值码`;

  if (!password) {
    showToast("请输入管理密码");
    return;
  }
  if (!Number.isFinite(amountYuan) || amountYuan <= 0) {
    showToast("金额要大于 0 元");
    return;
  }
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    showToast("数量范围是 1 到 1000");
    return;
  }

  const button = $("#generateCodesButton");
  button.disabled = true;
  button.textContent = "生成中...";
  setCodeAdminStatus("正在生成");

  try {
    const amountCents = Math.round(amountYuan * 100);
    const codes = Array.from({ length: count }, () => ({
      code: makeRedeemCode(),
      amountCents,
      label,
    }));
    const response = await fetch("/api/billing/admin/codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ codes }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || `生成失败：HTTP ${response.status}`);

    const created = Array.isArray(payload.codes) ? payload.codes : [];
    if (!created.length) throw new Error("没有生成任何兑换码");

    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    lastCodeAdminCsv = buildRedeemCodesCsv(created);
    lastCodeAdminFilename = `redeem-codes-${formatCodeAdminAmount(amountYuan)}yuan-${Date.now()}.csv`;
    $("#codeAdminOutput").value = created.map((item) => item.code).join("\n");
    setCodeAdminStatus(`已生成 ${created.length} 个`);
    downloadTextFile(lastCodeAdminCsv, lastCodeAdminFilename, "text/csv;charset=utf-8");
    showToast(`已生成 ${created.length} 个兑换码，并下载 CSV`);
  } catch (error) {
    setCodeAdminStatus("生成失败");
    showToast(error.message || "生成失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="download"></i><span>生成并下载 CSV</span>`;
    renderIcons();
  }
}

async function copyGeneratedCodes() {
  const text = $("#codeAdminOutput").value.trim();
  if (!text) {
    showToast("还没有可复制的兑换码");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("兑换码已复制");
  } catch {
    $("#codeAdminOutput").select();
    document.execCommand("copy");
    showToast("兑换码已复制");
  }
}

function downloadLastCodeCsv() {
  if (!lastCodeAdminCsv) {
    showToast("还没有生成过 CSV");
    return;
  }
  downloadTextFile(lastCodeAdminCsv, lastCodeAdminFilename || `redeem-codes-${Date.now()}.csv`, "text/csv;charset=utf-8");
}

function setCodeAdminStatus(text) {
  $("#codeAdminStatus").textContent = text;
}

async function loadPlatformAdminConfig(options = {}) {
  const password = $("#codeAdminPassword").value.trim();
  if (!password) {
    if (!options.silent) showToast("请输入管理密码");
    return;
  }
  setPlatformAdminStatus("读取中");
  try {
    const response = await fetch("/api/billing/admin/platform", {
      headers: { "X-Admin-Password": password },
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "读取推荐 API 配置失败");
    hydratePlatformAdminForm(payload.platform || {});
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    setPlatformAdminStatus(payload.platform?.enabled ? "已启用" : "未启用");
    if (!options.silent) showToast("已读取推荐 API 配置");
  } catch (error) {
    setPlatformAdminStatus("读取失败");
    if (!options.silent) showToast(error.message || "读取失败");
  }
}

async function savePlatformAdminConfig() {
  const password = $("#codeAdminPassword").value.trim();
  if (!password) {
    showToast("请输入管理密码");
    return;
  }

  const settings = readPlatformAdminForm();
  if (!settings.textEndpoint || !settings.apiKey) {
    showToast("请填写文生图接口和 API Key");
    return;
  }

  const button = $("#savePlatformConfigButton");
  button.disabled = true;
  button.textContent = "保存中...";
  setPlatformAdminStatus("保存中");
  try {
    const response = await fetch("/api/billing/admin/platform", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify(settings),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "保存推荐 API 配置失败");
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    hydratePlatformAdminForm(payload.platform || settings);
    await loadBilling();
    renderWallet();
    setPlatformAdminStatus(payload.platform?.enabled ? "已保存并启用" : "已保存");
    showToast("推荐 API 配置已保存");
  } catch (error) {
    setPlatformAdminStatus("保存失败");
    showToast(error.message || "保存失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>保存推荐 API</span>`;
    renderIcons();
  }
}

function hydratePlatformAdminForm(platform) {
  $("#platformTextEndpoint").value = platform.textEndpoint || "";
  $("#platformEditEndpoint").value = platform.editEndpoint || "";
  $("#platformApiKey").value = "";
  $("#platformApiKey").placeholder = platform.apiKeyConfigured ? "已配置，留空表示保持不变" : "sk-...";
  $("#platformPriceYuan").value = formatCodeAdminAmount((Number(platform.priceCents || billingState.priceCents) || 10) / 100);
  $("#platformCostYuan").value = formatCodeAdminAmount((Number(platform.upstreamCostCents || billingState.upstreamCostCents) || 0) / 100);
}

function hydratePlatformAdminPriceDefaults() {
  if (!$("#platformPriceYuan").value) $("#platformPriceYuan").value = formatCodeAdminAmount(billingState.priceCents / 100);
  if (!$("#platformCostYuan").value) $("#platformCostYuan").value = formatCodeAdminAmount(billingState.upstreamCostCents / 100);
}

function readPlatformAdminForm() {
  return {
    textEndpoint: $("#platformTextEndpoint").value.trim(),
    editEndpoint: $("#platformEditEndpoint").value.trim(),
    apiKey: $("#platformApiKey").value.trim(),
    priceCents: Math.max(1, Math.round(Number($("#platformPriceYuan").value || 0) * 100)),
    upstreamCostCents: Math.max(0, Math.round(Number($("#platformCostYuan").value || 0) * 100)),
  };
}

function setPlatformAdminStatus(text) {
  $("#platformAdminStatus").textContent = text;
}

function updateRecommendedApiLabels() {
  const priceLabel = formatPlatformPriceLabel(billingState.priceCents);
  const label = `推荐 API · ${priceLabel}`;
  const option = $('#apiProviderSelect option[value="platform"]');
  if (option) option.textContent = label;
  const intro = $("#platformPriceIntro");
  if (intro) intro.textContent = `本站支持自定义 API 与推荐 API。选择推荐 API 并充值后即可生成图片，当前 ${priceLabel}。`;
}

function formatPlatformPriceLabel(cents) {
  const value = Math.max(0, Number(cents || 0));
  if (value === 10) return "1毛/张";
  if (value % 10 === 0 && value < 100) return `${value / 10}毛/张`;
  return `${formatMoney(value)} 元/张`;
}

function makeRedeemCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((byte) => alphabet[byte % alphabet.length]);
  return `A2I-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}-${chars
    .slice(12, 16)
    .join("")}`;
}

function buildRedeemCodesCsv(codes) {
  const rows = [
    ["code", "amount_yuan", "label"],
    ...codes.map((item) => [item.code, formatMoney(item.amountCents), item.label || ""]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[,"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatCodeAdminAmount(amount) {
  return Number(amount || 0)
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

function downloadTextFile(text, filename, type = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([text], { type }), filename);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
}

function updateApiProviderUi() {
  const usingPlatform = isPlatformApiSelected();
  $("#settingsPanel").classList.toggle("platform-selected", usingPlatform);
  $("#walletToggle").classList.toggle("active", usingPlatform);
  updateRecommendedApiLabels();
}

function isPlatformApiSelected() {
  return $("#apiProviderSelect")?.value === "platform";
}

function updateBillingFromGenerationResponse(response) {
  const balance = Number(response.headers.get("X-Platform-Balance-Cents"));
  if (Number.isFinite(balance)) {
    billingState.balanceCents = balance;
    renderWallet();
  }
}

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function formatWalletTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 10) return `${key.slice(0, 3)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

async function loadState() {
  let legacy = {};
  try {
    legacy = JSON.parse(localStorage.getItem(FLOW_STATE_KEY) || "{}");
  } catch {
    legacy = {};
  }

  state.theme = legacy.theme || "dark";
  state.results = Array.isArray(legacy.results) ? legacy.results : [];
  state.references = Array.isArray(legacy.references) ? legacy.references : [];
  state.latestGenerationId = legacy.latestGenerationId || "";

  try {
    const saved = await readFlowStateFromDb();
    if (saved) {
      state.theme = saved.theme || state.theme;
      state.results = saved.results;
      state.references = saved.references;
      state.latestGenerationId = saved.latestGenerationId || "";
    } else if (state.results.length || state.references.length || state.latestGenerationId) {
      await persistState();
    }
  } catch (error) {
    console.warn("历史记录数据库读取失败，已临时回退到浏览器本地状态", error);
  }

  document.body.dataset.theme = state.theme;
}

async function persistState() {
  const meta = {
    id: FLOW_META_ID,
    theme: state.theme,
    latestGenerationId: state.latestGenerationId,
    updatedAt: Date.now(),
  };

  try {
    await writeFlowStateToDb(meta, state.results, state.references);
  } catch (error) {
    console.warn("历史记录保存失败", error);
    showToast("历史记录保存失败，浏览器存储空间可能不足");
  }

  try {
    localStorage.setItem(FLOW_STATE_KEY, JSON.stringify(meta));
  } catch (error) {
    console.warn("历史记录元数据保存失败", error);
  }
}

function openFlowDb() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("当前浏览器不支持 IndexedDB"));
  }
  if (flowDbPromise) return flowDbPromise;

  flowDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(FLOW_DB_NAME, FLOW_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FLOW_META_STORE)) {
        db.createObjectStore(FLOW_META_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FLOW_RESULTS_STORE)) {
        const results = db.createObjectStore(FLOW_RESULTS_STORE, { keyPath: "id" });
        results.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(FLOW_REFERENCES_STORE)) {
        db.createObjectStore(FLOW_REFERENCES_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB 打开失败"));
  });

  return flowDbPromise;
}

async function readFlowStateFromDb() {
  const db = await openFlowDb();
  const [meta, results, references] = await Promise.all([
    idbGet(db, FLOW_META_STORE, FLOW_META_ID),
    idbGetAll(db, FLOW_RESULTS_STORE),
    idbGetAll(db, FLOW_REFERENCES_STORE),
  ]);

  if (!meta && !results.length && !references.length) return null;
  return {
    theme: meta?.theme || state.theme,
    latestGenerationId: meta?.latestGenerationId || "",
    results: results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    references,
  };
}

async function writeFlowStateToDb(meta, results, references) {
  const db = await openFlowDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FLOW_META_STORE, FLOW_RESULTS_STORE, FLOW_REFERENCES_STORE], "readwrite");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB 写入失败"));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB 写入中止"));

    transaction.objectStore(FLOW_META_STORE).put(meta);
    replaceStoreItems(transaction.objectStore(FLOW_RESULTS_STORE), results);
    replaceStoreItems(transaction.objectStore(FLOW_REFERENCES_STORE), references);
  });
}

function replaceStoreItems(store, items) {
  store.clear();
  items.forEach((item) => store.put(item));
}

function idbGet(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("IndexedDB 读取失败"));
  });
}

function idbGetAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error || new Error("IndexedDB 读取失败"));
  });
}

async function persistableImageSource(src) {
  if (!src || src.startsWith("data:")) return src;
  if ((config.transportMode === "proxy" || isPlatformApiSelected()) && /^https?:\/\//i.test(src)) {
    try {
      const response = await fetch("/api/cache-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: src }),
      });
      const payload = await response.json();
      if (response.ok && payload.dataUrl) return payload.dataUrl;
    } catch {
      // Browser fetch below is still useful when the image server allows CORS.
    }
  }

  try {
    const response = await fetch(src, { cache: "no-store" });
    if (!response.ok) return src;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return src;
    return blobToDataUrl(await response.blob());
  } catch {
    return src;
  }
}

function loadGenerationLogs() {
  try {
    const saved = JSON.parse(localStorage.getItem(GENERATION_LOGS_KEY) || "[]");
    generationLogs = Array.isArray(saved) ? saved.slice(0, GENERATION_LOG_LIMIT) : [];
  } catch {
    generationLogs = [];
  }
}

function saveGenerationLogs() {
  try {
    localStorage.setItem(GENERATION_LOGS_KEY, JSON.stringify(generationLogs.slice(0, GENERATION_LOG_LIMIT)));
  } catch (error) {
    console.warn("生成日志保存失败", error);
  }
}

function startGenerationLog(endpoint, options) {
  const log = {
    id: makeId(),
    generationId: options.generationId || "",
    status: "running",
    startedAt: Date.now(),
    endedAt: 0,
    durationMs: 0,
    endpoint,
    options: summarizeOptionsForLog(options),
    imageCount: 0,
    costCents: 0,
    message: "",
    error: "",
    requests: [],
  };
  generationLogs = [log, ...generationLogs].slice(0, GENERATION_LOG_LIMIT);
  saveGenerationLogs();
  renderGenerationLogs();
  return log;
}

function finishGenerationLog(status, details = {}) {
  if (!activeGenerationLog) return;
  activeGenerationLog.status = status;
  activeGenerationLog.endedAt = Date.now();
  activeGenerationLog.durationMs = activeGenerationLog.endedAt - activeGenerationLog.startedAt;
  activeGenerationLog.imageCount = Number(details.imageCount) || 0;
  activeGenerationLog.costCents = totalGenerationLogCost(activeGenerationLog);
  activeGenerationLog.message = details.message || "";
  activeGenerationLog.error = details.error || "";
  saveGenerationLogs();
  renderGenerationLogs();
}

function startRequestLog(endpoint, request, options, meta = {}) {
  if (!activeGenerationLog) return null;
  const entry = {
    id: makeId(),
    label: meta.label || requestLogLabel(options),
    variant: meta.variant || "",
    status: "pending",
    startedAt: Date.now(),
    endedAt: 0,
    durationMs: 0,
    endpoint,
    prompt: buildPrompt(options),
    params: summarizeOptionsForLog(options),
    request: summarizeRequestForLog(request),
    httpStatus: 0,
    ok: false,
    contentType: "",
    imageCount: 0,
    costCents: 0,
    responsePreview: "",
    error: "",
    completed: false,
  };
  activeGenerationLog.requests.push(entry);
  saveGenerationLogs();
  renderGenerationLogs();
  return entry;
}

function completeRequestLog(entry, details = {}) {
  if (!entry || entry.completed) return;
  entry.completed = true;
  entry.endedAt = Date.now();
  entry.durationMs = entry.endedAt - entry.startedAt;
  Object.assign(entry, details);
  if (!Number.isFinite(Number(entry.costCents))) entry.costCents = 0;
  if (activeGenerationLog) activeGenerationLog.costCents = totalGenerationLogCost(activeGenerationLog);
  saveGenerationLogs();
  renderGenerationLogs();
}

function renderGenerationLogs() {
  const list = $("#generationLogList");
  if (!list) return;
  renderCurrentLogPreview();

  const notice = `<div class="log-notice">生成速度和稳定性主要取决于你使用的 API 服务。不同中转站或模型通道的响应时间、超时策略和跨域支持可能不同；如果遇到超时、失败或结果未知，可以稍后重试、降低单次生成数量，或切换到更稳定的 API 再生成。</div>`;

  if (!generationLogs.length) {
    list.innerHTML = `${notice}<div class="log-empty">还没有生成日志。发起一次生成后，这里会显示请求和返回。</div>`;
    return;
  }

  list.innerHTML = notice + generationLogs
    .map((log, index) => {
      const status = generationStatusLabel(log.status);
      const prompt = log.options?.prompt || "";
      const requestCount = Array.isArray(log.requests) ? log.requests.length : 0;
      const summary = `${log.options?.model || ""} · ${log.options?.size || ""} · ${log.options?.count || 1} 张 · ${multiModeLabel(log.options?.multiImageMode)}`;
      const requests = (log.requests || []).map(renderRequestLog).join("");
      return `
        <details class="log-entry ${escapeHtml(log.status)}" ${index === 0 ? "open" : ""}>
          <summary>
            <span class="log-status">${status}</span>
            <strong>${escapeHtml(formatLogTime(log.startedAt))}</strong>
            <small>${escapeHtml(prompt || "无提示词")}</small>
          </summary>
          <div class="log-meta">
            <span>${escapeHtml(summary)}</span>
            <span>请求 ${requestCount} 次</span>
            <span>返回图片 ${Number(log.imageCount) || 0} 张</span>
            ${log.durationMs ? `<span>用时 ${Math.max(1, Math.round(log.durationMs / 1000))} 秒</span>` : ""}
          </div>
          ${log.message ? `<p class="log-message">${escapeHtml(log.message)}</p>` : ""}
          ${log.error ? `<p class="log-error">${escapeHtml(log.error)}</p>` : ""}
          <div class="log-endpoint">${escapeHtml(log.endpoint || "")}</div>
          <div class="log-requests">${requests || '<div class="log-empty">还没有发出请求。</div>'}</div>
        </details>
      `;
    })
    .join("");
}

function renderCurrentLogPreview() {
  const preview = $("#currentLogPreview");
  if (!preview || preview.hidden) return;
  const log = activeGenerationLog || generationLogs[0];
  if (!log) {
    preview.innerHTML = `<div class="current-log-empty">暂无当前生成日志</div>`;
    return;
  }

  const requests = (log.requests || [])
    .slice(-8)
    .map((entry) => {
      const status = requestStatusLabel(entry);
      return `
        <div class="current-log-row ${escapeHtml(entry.status || "")}">
          <span>${escapeHtml(entry.label || "请求")}</span>
          <strong>${escapeHtml(status)}</strong>
          <small>${escapeHtml(entry.durationMs ? `${entry.durationMs}ms` : "进行中")}</small>
          <small class="log-cost">${escapeHtml(formatMoney(entry.costCents || 0))} 元</small>
        </div>
      `;
    })
    .join("");

  preview.innerHTML = `
    <div class="current-log-head">
      <strong>${escapeHtml(generationStatusLabel(log.status))}</strong>
      <span>${escapeHtml(log.options?.prompt || "无提示词")}</span>
    </div>
    <div class="current-log-meta">
      <span>请求 ${(log.requests || []).length} 次</span>
      <span>返回图片 ${Number(log.imageCount) || 0} 张</span>
      <span>${escapeHtml(multiModeLabel(log.options?.multiImageMode))}</span>
    </div>
    ${log.error ? `<p class="current-log-error">${escapeHtml(log.error)}</p>` : ""}
    <div class="current-log-rows">${requests || '<div class="current-log-empty">等待请求开始</div>'}</div>
  `;
}

function renderRequestLog(entry) {
  const status = requestStatusLabel(entry);
  const text = requestLogText(entry);
  return `
    <details class="log-request ${escapeHtml(entry.status || "")}">
      <summary>
        <span>${escapeHtml(entry.label || "请求")}</span>
        <strong>${escapeHtml(status)}</strong>
        <small>${escapeHtml(entry.durationMs ? `${entry.durationMs}ms` : "进行中")}</small>
        <small class="log-cost">${escapeHtml(formatMoney(entry.costCents || 0))} 元</small>
      </summary>
      <pre>${escapeHtml(text)}</pre>
    </details>
  `;
}

function requestLogText(entry) {
  return [
    `提示词:\n${entry.prompt || ""}`,
    `请求变体:\n${entry.variant || "-"}`,
    `参数:\n${summarizeLogValue(entry.params)}`,
    `请求:\n${summarizeLogValue(entry.request)}`,
    `本张花费:\n${formatMoney(entry.costCents || 0)} 元`,
    `API 返回:\nHTTP ${entry.httpStatus || "-"} · ${entry.contentType || "unknown"} · 图片 ${entry.imageCount || 0} 张\n${entry.responsePreview || entry.error || "暂无返回"}`,
  ].join("\n\n");
}

function totalGenerationLogCost(log) {
  return (log?.requests || []).reduce((sum, entry) => sum + Math.max(0, Number(entry.costCents || 0)), 0);
}

function clearGenerationLogs() {
  generationLogs = [];
  activeGenerationLog = null;
  saveGenerationLogs();
  renderGenerationLogs();
  showToast("生成日志已清空");
}

function loadApiStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(API_STATS_KEY) || "[]");
    apiStats = mergeApiStats(Array.isArray(saved) ? saved.map(normalizeApiStat).filter(Boolean) : []);
  } catch {
    apiStats = [];
  }
}

function saveApiStats() {
  try {
    localStorage.setItem(API_STATS_KEY, JSON.stringify(apiStats.slice(0, API_STATS_LIMIT)));
  } catch (error) {
    console.warn("API 统计保存失败", error);
  }
}

function normalizeApiStat(entry) {
  if (!entry || typeof entry !== "object") return null;
  return {
    id: entry.id || makeId(),
    endpoint: entry.endpoint || "",
    endpointHost: entry.endpointHost || endpointHostLabel(entry.endpoint || ""),
    keyFingerprint: entry.keyFingerprint || "no-key",
    keyLabel: entry.keyLabel || "未填写 Key",
    mode: entry.mode || "text",
    model: entry.model || "",
    total: Number(entry.total) || 0,
    success: Number(entry.success) || 0,
    failed: Number(entry.failed) || 0,
    images: Number(entry.images) || 0,
    firstUsedAt: Number(entry.firstUsedAt) || Date.now(),
    lastUsedAt: Number(entry.lastUsedAt) || Date.now(),
    lastStatus: entry.lastStatus || "",
    lastHttpStatus: Number(entry.lastHttpStatus) || 0,
    lastError: entry.lastError || "",
  };
}

async function recordApiUsage(endpoint, options = {}, requestLog = null, details = {}) {
  const now = Date.now();
  const keyFingerprint = await fingerprintApiKey(config.apiKey);
  const statKey = apiStatKey({ endpoint, keyFingerprint, mode: options.mode || "text", model: options.model || "" });
  const existing = apiStats.find((entry) => apiStatKey(entry) === statKey);
  const stat =
    existing ||
    normalizeApiStat({
      id: makeId(),
      endpoint,
      endpointHost: endpointHostLabel(endpoint),
      keyFingerprint,
      keyLabel: maskApiKey(config.apiKey) || "未填写 Key",
      mode: options.mode || "text",
      model: options.model || "",
      firstUsedAt: now,
    });

  stat.endpoint = endpoint || "";
  stat.endpointHost = endpointHostLabel(endpoint);
  stat.keyFingerprint = keyFingerprint;
  stat.keyLabel = maskApiKey(config.apiKey) || "未填写 Key";
  stat.mode = options.mode || stat.mode || "text";
  stat.model = options.model || stat.model || "";
  stat.total += 1;
  if (details.status === "success") stat.success += 1;
  else stat.failed += 1;
  stat.images += Number(requestLog?.imageCount || 0);
  stat.lastUsedAt = now;
  stat.lastStatus = details.status || requestLog?.status || "";
  stat.lastHttpStatus = Number(requestLog?.httpStatus || 0);
  stat.lastError = details.error ? truncateText(details.error, 220) : requestLog?.error || "";

  apiStats = mergeApiStats([stat, ...apiStats.filter((entry) => entry.id !== stat.id)]);
  saveApiStats();
  renderApiStats();
}

function mergeApiStats(items) {
  const merged = new Map();
  for (const item of items) {
    const stat = normalizeApiStat(item);
    if (!stat) continue;
    const key = apiStatKey(stat);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, stat);
      continue;
    }
    existing.total += stat.total;
    existing.success += stat.success;
    existing.failed += stat.failed;
    existing.images += stat.images;
    existing.firstUsedAt = Math.min(existing.firstUsedAt || stat.firstUsedAt, stat.firstUsedAt || existing.firstUsedAt);
    if ((stat.lastUsedAt || 0) >= (existing.lastUsedAt || 0)) {
      existing.lastUsedAt = stat.lastUsedAt;
      existing.lastStatus = stat.lastStatus;
      existing.lastHttpStatus = stat.lastHttpStatus;
      existing.lastError = stat.lastError;
      existing.keyLabel = stat.keyLabel || existing.keyLabel;
    }
  }
  return [...merged.values()].sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, API_STATS_LIMIT);
}

function apiStatKey(entry) {
  return [entry.endpoint || "", entry.keyFingerprint || "no-key", entry.mode || "text", entry.model || ""].join("|");
}

function renderApiStats() {
  const summary = $("#apiStatsSummary");
  const list = $("#apiStatsList");
  if (!summary || !list) return;

  const totals = apiStats.reduce(
    (acc, item) => {
      acc.total += item.total;
      acc.success += item.success;
      acc.failed += item.failed;
      acc.images += item.images;
      return acc;
    },
    { total: 0, success: 0, failed: 0, images: 0 },
  );

  summary.innerHTML = `
    <div><strong>${totals.total}</strong><span>请求</span></div>
    <div><strong>${totals.success}</strong><span>成功</span></div>
    <div><strong>${totals.failed}</strong><span>失败</span></div>
    <div><strong>${totals.images}</strong><span>图片</span></div>
  `;

  if (!apiStats.length) {
    list.innerHTML = `<div class="log-empty">还没有 API 统计。发起一次生成后，这里会显示本机测试数据。</div>`;
    return;
  }

  list.innerHTML = apiStats
    .map((item) => {
      const okRate = item.total ? Math.round((item.success / item.total) * 100) : 0;
      return `
        <article class="api-stat-card">
          <div class="api-stat-head">
            <strong>${escapeHtml(item.endpointHost || "未知 API")}</strong>
            <span>${escapeHtml(item.lastStatus === "success" ? "成功" : item.lastStatus === "failed" ? "失败" : "记录")}</span>
          </div>
          <div class="api-stat-endpoint">${escapeHtml(item.endpoint || "")}</div>
          <div class="api-stat-grid">
            <span>Key ${escapeHtml(item.keyLabel || "未填写 Key")}</span>
            <span>指纹 ${escapeHtml(item.keyFingerprint || "no-key")}</span>
            <span>${escapeHtml(modeLabel(item.mode))}</span>
            <span>${escapeHtml(item.model || "-")}</span>
            <span>请求 ${item.total}</span>
            <span>成功率 ${okRate}%</span>
            <span>图片 ${item.images}</span>
            <span>最近 ${escapeHtml(formatLogTime(item.lastUsedAt))}</span>
          </div>
          ${item.lastError ? `<p class="log-error">${escapeHtml(item.lastError)}</p>` : ""}
        </article>
      `;
    })
    .join("");
}

function clearApiStats() {
  apiStats = [];
  saveApiStats();
  renderApiStats();
  showToast("API 统计已清空");
}

function endpointHostLabel(endpoint) {
  try {
    return endpoint ? new URL(endpoint).host : "未设置 API";
  } catch {
    return String(endpoint || "未设置 API").replace(/^https?:\/\//i, "").split("/")[0] || "未设置 API";
  }
}

async function fingerprintApiKey(key) {
  const normalized = normalizeApiKeyForFingerprint(key);
  if (!normalized) return "no-key";
  if (!window.crypto?.subtle || typeof TextEncoder === "undefined") return fingerprintApiKeySync(normalized);
  const bytes = new TextEncoder().encode(`api2image:key:v1:${normalized}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `k1-${hex.slice(0, 16)}`;
}

function fingerprintApiKeySync(key) {
  const normalized = normalizeApiKeyForFingerprint(key);
  if (!normalized) return "no-key";
  let hash = 2166136261;
  const scoped = `api2image:key:v1:${normalized}`;
  for (let index = 0; index < scoped.length; index += 1) {
    hash ^= scoped.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizeApiKeyForFingerprint(key) {
  return String(key || "").trim().replace(/^Bearer\s+/i, "");
}

function summarizeOptionsForLog(options) {
  return {
    mode: options.mode,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt,
    ratio: options.ratio,
    size: options.size,
    count: options.count,
    multiImageMode: options.multiImageMode,
    quality: options.quality,
    seed: options.seed,
    model: options.model,
    batchIndex: options.batchIndex || "",
    batchTotal: options.batchTotal || "",
    requestAttempt: options.requestAttempt || 1,
    referenceImages: (options.referenceImages || []).map((image) => ({
      name: image.name || "",
      dataUrl: summarizeImageData(image.dataUrl || ""),
    })),
  };
}

function summarizeRequestForLog(request) {
  const summary = {
    method: request.method || "POST",
    bodyType: request.bodyType || "json",
    headers: sanitizeForLog(request.headers || {}),
  };
  if (request.bodyType === "multipart") {
    summary.fields = sanitizeForLog(request.fields || {});
    summary.files = (request.files || []).map((file) => ({
      field: file.field,
      filename: file.filename,
      dataUrl: summarizeImageData(file.dataUrl || ""),
    }));
  } else {
    summary.body = summarizeRequestBody(request.body || "");
  }
  return summary;
}

function summarizeRequestBody(body) {
  try {
    return sanitizeForLog(JSON.parse(body));
  } catch {
    return sanitizeForLog(body);
  }
}

function summarizeLogValue(value) {
  return truncateText(JSON.stringify(sanitizeForLog(value), null, 2), 6000);
}

function sanitizeForLog(value, key = "", depth = 0) {
  if (value == null) return value;
  if (depth > 6) return "[已截断]";
  if (typeof value === "string") {
    if (/authorization|api[-_ ]?key|secret|token/i.test(key)) return "[已隐藏]";
    if (value.startsWith("data:image/")) return summarizeImageData(value);
    if (looksLikeLongBase64(value)) return `[base64 已隐藏，长度 ${value.length}]`;
    return truncateText(redactSecrets(value), 2400);
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const items = value.slice(0, 20).map((item) => sanitizeForLog(item, key, depth + 1));
    if (value.length > 20) items.push(`[还有 ${value.length - 20} 项已省略]`);
    return items;
  }
  return Object.fromEntries(
    Object.entries(value).map(([nestedKey, nested]) => [nestedKey, sanitizeForLog(nested, nestedKey, depth + 1)]),
  );
}

function summarizeImageData(value) {
  if (!value) return "";
  const mime = String(value).match(/^data:([^;,]+)/)?.[1] || "image";
  return `[${mime} 数据已隐藏，长度 ${String(value).length}]`;
}

function looksLikeLongBase64(value) {
  return value.length > 220 && /^[A-Za-z0-9+/_=-]+$/.test(value);
}

function redactSecrets(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [已隐藏]")
    .replace(/sk-[A-Za-z0-9._-]+/gi, "sk-[已隐藏]");
}

function truncateText(value, limit) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit)}\n...已截断 ${text.length - limit} 字符` : text;
}

function requestLogLabel(options) {
  const attempt = Number(options.requestAttempt || 1);
  const attemptLabel = attempt > 1 ? ` · 尝试 ${attempt}` : "";
  if (options.batchTotal > 1) return `第 ${options.batchIndex}/${options.batchTotal} 张${attemptLabel}`;
  if (options.count > 1) return `批量 ${options.count} 张${attemptLabel}`;
  return `单图请求${attemptLabel}`;
}

function generationStatusLabel(status) {
  return { running: "生成中", completed: "完成", partial: "部分完成", failed: "失败", cancelled: "已取消" }[status] || status || "未知";
}

function requestStatusLabel(entry) {
  if (entry.status === "pending") return "请求中";
  if (entry.status === "success") return `成功 ${entry.httpStatus || ""}`.trim();
  if (entry.status === "no-image") return `无图片 ${entry.httpStatus || ""}`.trim();
  return `失败 ${entry.httpStatus || ""}`.trim();
}

function multiModeLabel(mode) {
  return mode === "batch" ? "批量优先（不补单）" : "逐张稳定";
}

function modeLabel(mode) {
  return mode === "image" ? "图生图" : "文生图";
}

function formatLogTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateTemplateVisibility() {
  $("#customTemplateField").hidden = $("#requestFormat").value !== "json";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = state.theme;
  persistState();
}

function setGenerating(generating) {
  $("#generateButton").disabled = generating;
  $("#generateButton").innerHTML = generating ? '<i data-icon="sparkles"></i>' : '<i data-icon="arrow-right"></i>';
  $("#cancelGenerateButton").hidden = !generating;
  renderIcons();
}

function cancelGeneration(event) {
  event?.stopPropagation();
  if (!isGenerating || generationCancelled) return;
  generationCancelled = true;
  generationAbortController?.abort();
  updateProgress("正在取消生成", "已发送取消信号，正在停止未完成的请求", currentProgress);
  showToast("正在取消生成，已完成的图片会尽量保留");
}

function onProgressClick(event) {
  if (event.target.closest("button")) return;
  const preview = $("#currentLogPreview");
  const progress = $("#generationProgress");
  const expanded = preview.hidden;
  preview.hidden = !expanded;
  progress.classList.toggle("expanded", expanded);
  if (expanded) renderCurrentLogPreview();
}

function startProgress(title, detail, percent, counts = {}) {
  progressStartedAt = Date.now();
  currentProgress = percent;
  setProgressCounts(counts);
  $("#generationProgress").classList.remove("failed");
  $("#generationProgress").hidden = false;
  $("#currentLogPreview").hidden = true;
  $("#generationProgress").classList.remove("expanded");
  applyProgress(title, detail, percent);
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (currentProgress >= 92) return;
    const elapsed = (Date.now() - progressStartedAt) / 1000;
    const eased = Math.min(92, 28 + Math.log2(elapsed + 1) * 18);
    applyProgress("等待模型生成", `仍在生成中，已等待 ${Math.floor(elapsed)} 秒`, Math.max(currentProgress, eased));
  }, 800);
}

function updateProgress(title, detail, percent, counts = {}) {
  currentProgress = Math.max(currentProgress, percent);
  setProgressCounts(counts);
  if (title.includes("失败")) $("#generationProgress").classList.add("failed");
  applyProgress(title, detail, currentProgress);
}

function applyProgress(title, detail, percent) {
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  $("#progressTitle").textContent = title;
  $("#progressDetail").textContent = detail;
  $("#progressBar").style.width = `${rounded}%`;
  $("#progressCount").textContent = progressTotal ? `已生成 ${progressGenerated}/${progressTotal}` : "";
  $("#progressPercent").textContent = `${rounded}%`;
  $("#resultMeta").textContent = detail;
  renderCurrentLogPreview();
}

function setProgressCounts({ generated, total } = {}) {
  if (Number.isFinite(Number(total)) && Number(total) > 0) progressTotal = Number(total);
  if (Number.isFinite(Number(generated))) progressGenerated = Math.max(0, Math.min(progressTotal || Number(generated), Number(generated)));
}

function hideProgress() {
  clearInterval(progressTimer);
  progressTimer = null;
  $("#generationProgress").hidden = true;
  $("#currentLogPreview").hidden = true;
  $("#generationProgress").classList.remove("expanded");
  $("#progressBar").style.width = "0%";
  renderResults();
}

function elapsedSeconds() {
  return Math.max(1, Math.round((Date.now() - progressStartedAt) / 1000));
}

function ensureModelOption(model) {
  if (!model) return;
  const select = $("#modelName");
  if (![...select.options].some((option) => option.value === model)) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    select.insertBefore(option, select.querySelector('option[value="custom"]'));
  }
}

function optionHtml(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function tryParseJsonString(value) {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return "";
  }
}

function tryParseJsonValue(value) {
  const text = String(value || "").trim();
  const candidates = [text];
  const unescapedJson = unwrapEscapedJsonText(text);
  if (unescapedJson && unescapedJson !== text) candidates.push(unescapedJson);

  for (const candidate of candidates) {
    if (!/^[{\["]/.test(candidate)) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === "string" && parsed.trim() !== candidate) {
        return tryParseJsonValue(parsed) ?? parsed;
      }
      return parsed;
    } catch {
      // Try the next normalized candidate.
    }
  }
  return null;
}

function unwrapEscapedJsonText(value) {
  const text = String(value || "").trim();
  const normalized = text.replace(/^(?:\\[rnt]\s*)+/, "").replace(/\\"/g, '"').replace(/\\\//g, "/");
  return /^[{\[]/.test(normalized) ? normalized : "";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function previewPayload(payload) {
  try {
    const text = typeof payload === "string" ? payload : JSON.stringify(payload);
    return text.slice(0, 360);
  } catch {
    return "无法预览返回内容";
  }
}

function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileNameFor(item) {
  return `image2-${item.createdAt || Date.now()}.png`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function getImageDimensionsSafe(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => resolve({ width: 1, height: 1 });
    image.src = src;
  });
}

async function downloadImage(src, filename) {
  try {
    const blob = src.startsWith("data:") ? dataUrlToBlob(src) : await fetch(src).then((response) => response.blob());
    downloadBlob(blob, filename);
  } catch {
    const anchor = document.createElement("a");
    anchor.href = src;
    anchor.download = filename;
    anchor.target = "_blank";
    anchor.click();
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 5200);
}

function renderIcons() {
  document.querySelectorAll("i[data-icon]").forEach((icon) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = iconPaths[icon.dataset.icon] || iconPaths.sparkles;
    icon.replaceWith(svg);
  });
}

init();
