const CONFIG_KEY = "image2.canvas.config.v1";
const CONFIG_VERSION = 3;
const CONFIG_HISTORY_KEY = "image2.canvas.config.history.v1";
const GENERATION_LOGS_KEY = "image2.generation.logs.v1";
const API_STATS_KEY = "image2.api.stats.v1";
const FLOW_STATE_KEY = "image2.flow.state.v1";
const CODE_ADMIN_PASSWORD_KEY = "image2.code.admin.password.v1";
const LOGIN_CODE_COOLDOWN_KEY = "image2.login.code.cooldown.v1";
const WALLET_SESSION_TOKEN_KEY = "image2.wallet.session.v1";
const CONFIG_HISTORY_LIMIT = 12;
const GENERATION_LOG_LIMIT = 30;
const API_STATS_LIMIT = 80;
const LOGIN_CODE_RESEND_COOLDOWN_SECONDS = 60;
const FIXED_MODEL_NAME = "gpt-image-2";
const API_STATS_OPEN_PHRASE = "apistats";
const CODE_ADMIN_OPEN_PHRASE = "codeadmin";
const SITE_API_DISPLAY_PREFIX = "站点配置";
const ANNOUNCEMENTS_SEEN_KEY = "image2.announcements.seenAt.v1";
const SITE_VISIT_TRACK_KEY = "image2.site.visit.tracked.v1";
const SITE_HEARTBEAT_INTERVAL_MS = 30000;
const ANNOUNCEMENTS_REFRESH_INTERVAL_MS = 45000;
const SINGLE_IMAGE_MAX_ATTEMPTS = 2;
const PLATFORM_PRICE_FALLBACK_CENTS = 10;
const PLATFORM_MAX_BATCH_REQUEST_COUNT = 1;
const DEFAULT_IMAGE_SIZE = "1024x1024";
const DEFAULT_PHP_API_BASE = "https://api2img.shop/php-api/index.php";
const FAST_API_TIMEOUT_MS = 6500;
const GENERATION_READY_WAIT_MS = 2200;
const ADMIN_API_TIMEOUT_MS = 8000;
const CUSTOM_API_PROXY_TIMEOUT_MS = 300000;
const PLATFORM_GENERATION_RETRY_DELAY_MS = 1400;
const REFERENCE_API_MAX_BYTES = 2 * 1024 * 1024;
const REFERENCE_API_MAX_DIMENSION = 1536;
const REFERENCE_API_JPEG_QUALITY_START = 0.86;
const REFERENCE_API_JPEG_QUALITY_MIN = 0.72;
const REFERENCE_API_JPEG_QUALITY_STEP = 0.06;
const RESULT_CACHE_TIMEOUT_MS = 4500;
const IMAGE_DIMENSION_TIMEOUT_MS = 2200;
const FLOW_DB_NAME = "image2.flow.history";
const FLOW_DB_VERSION = 1;
const FLOW_META_STORE = "meta";
const FLOW_RESULTS_STORE = "results";
const FLOW_REFERENCES_STORE = "references";
const FLOW_META_ID = "flow";
const API_BASE = (window.API2IMAGE_API_BASE || "").replace(/\/+$/, "");

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const ratioPresets = [
  { label: "自适应", value: "auto", sizes: ["auto"] },
  { label: "1:1 方图", value: "1:1", sizes: ["auto"] },
  { label: "4:3 横图", value: "4:3", sizes: ["auto"] },
  { label: "3:4 竖图", value: "3:4", sizes: ["auto"] },
  { label: "16:9 宽屏", value: "16:9", sizes: ["auto"] },
  { label: "9:16 竖屏", value: "9:16", sizes: ["auto"] },
  { label: "2:3 海报", value: "2:3", sizes: ["auto"] },
  { label: "3:2 摄影", value: "3:2", sizes: ["auto"] },
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
  pin: '<path d="M12 17v5"/><path d="M5 17h14"/><path d="m7 9 5-5 5 5"/><path d="M12 4v13"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
  sparkles: '<path d="m12 3-1.8 5.4L5 10.2l5.2 1.8L12 17l1.8-5 5.2-1.8-5.2-1.8Z"/><path d="M5 3v4"/><path d="M3 5h4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 10H3c0-3 3-3 3-10"/><path d="M10 19a2 2 0 0 0 4 0"/>',
};

const config = {
  textEndpoint: "",
  editEndpoint: "",
  apiKey: "",
  rememberKey: false,
  requestFormat: "openai",
  transportMode: "proxy",
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
  authenticated: false,
  email: "",
  balanceCents: 0,
  priceCents: PLATFORM_PRICE_FALLBACK_CENTS,
  upstreamCostCents: 4,
  platformEnabled: false,
  configLoaded: false,
  rechargeUrl: "https://api2img.shop/",
  directBaseUrl: "",
  sessionToken: "",
  lastDirectConfig: null,
  platformRequestFormat: "openai",
  platformTransportMode: "proxy",
  platformCustomTemplate: "",
  platformModelName: "",
  platformDisplayName: "站点配置1",
  ledger: [],
  ledgerLoading: false,
  activeOrder: null,
};

const siteStatsState = {
  onlineCount: 0,
  totalVisits: 0,
  todayVisits: 0,
  totalVisitors: 0,
  lastVisitAt: 0,
  updatedAt: 0,
  onlineWindowMs: 3 * 60 * 1000,
};

const announcementState = {
  items: [],
  seenAt: 0,
  latestAt: 0,
  unreadCount: 0,
  lastAutoPopupAt: 0,
};
const codeAdminState = {
  authenticated: false,
  activeSection: "codes",
  pendingSection: "codes",
};
const customDebugState = {
  enabled: false,
  loaded: false,
  current: null,
  history: [],
  global: null,
  updatedAt: 0,
};
let platformBrowserGlobalLoadPromise = null;

let toastTimer = null;
let progressTimer = null;
let progressStartedAt = 0;
let currentProgress = 0;
let progressGenerated = 0;
let progressTotal = 0;
let configHistory = [];
let generationLogs = [];
let apiStats = [];
let apiUsageRecords = new Map();
let activeGenerationLog = null;
let isGenerating = false;
let generationAbortController = null;
let generationCancelled = false;
let flowDbPromise = null;
let statsOpenBuffer = "";
let codeAdminOpenBuffer = "";
let siteStatsRefreshTimer = null;
let siteHeartbeatTimer = null;
let siteHeartbeatInFlight = false;
let siteVisitTracked = false;
let announcementRefreshTimer = null;
let announcementAutoOpenTimer = null;
let resultMasonryFrame = 0;
let resultMasonryObserver = null;
let resultMasonryObservedWidth = 0;
let loginCodeCooldownTimer = null;
let loginCodeCooldownUntil = 0;
let lastCodeAdminCsv = "";
let lastCodeAdminFilename = "";
let billingReadyPromise = null;
let directApiWarmupPromise = null;
const detailView = {
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  pinching: false,
  pointers: new Map(),
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
  pinchStartDistance: 1,
  pinchStartScale: 1,
  pinchStartX: 0,
  pinchStartY: 0,
  pinchStartCenterX: 0,
  pinchStartCenterY: 0,
};

async function init() {
  fillControls();
  loadConfig();
  loadWalletSessionToken();
  loadLoginCodeCooldown();
  loadConfigHistory();
  loadGenerationLogs();
  loadApiStats();
  hydrateConfig();
  renderConfigHistory();
  renderGenerationLogs();
  renderApiStats();
  renderSiteStats();
  renderAnnouncements();
  renderWallet();
  bindEvents();
  renderReferences();
  renderResults();
  renderIcons();
  autoGrow($("#promptInput"));
  afterFirstPaint(() => {
    runWhenIdle(() => {
      billingReadyPromise = loadBilling().catch((error) => console.warn("充值信息读取失败", error));
      loadState()
        .then(() => {
          renderReferences();
          renderResults();
          renderIcons();
        })
        .catch((error) => console.warn("本地图片状态读取失败", error));
      startSiteHeartbeat();
      trackSiteVisit().catch((error) => console.warn("站点访问上报失败", error));
      loadSiteStats({ silent: true }).catch((error) => console.warn("站点统计读取失败", error));
      loadAnnouncements({ silent: true }).catch((error) => console.warn("公告读取失败", error));
    }, 350);
  });
}

function afterFirstPaint(callback) {
  requestAnimationFrame(() => setTimeout(callback, 0));
}

function runWhenIdle(callback, timeout = 500) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }
  setTimeout(callback, Math.min(timeout, 500));
}

function fillControls() {
  $("#ratioSelect").innerHTML = ratioPresets.map((item) => optionHtml(item.value, item.label)).join("");
  $("#countSelect").innerHTML = [1, 2, 3, 4, 6, 8].map((count) => optionHtml(String(count), `${count} 张`)).join("");
  $("#qualitySelect").innerHTML = qualityPresets.map((item) => optionHtml(item.value, item.label)).join("");
  syncSizeOptions();
}

function bindEvents() {
  $("#settingsToggle")?.addEventListener("click", () => $("#settingsPanel")?.classList.toggle("open"));
  $("#closeSettings")?.addEventListener("click", () => $("#settingsPanel")?.classList.remove("open"));
  $("#walletToggle").addEventListener("click", () => {
    $("#walletPanel").classList.toggle("open");
    refreshBilling();
  });
  $("#closeWallet").addEventListener("click", () => $("#walletPanel").classList.remove("open"));
  $("#apiProviderSelect")?.addEventListener("change", onApiProviderChange);
  $("#sendLoginCodeButton").addEventListener("click", sendLoginCode);
  $("#loginButton").addEventListener("click", verifyLoginCode);
  $("#logoutButton").addEventListener("click", logoutWallet);
  $("#redeemCodeButton").addEventListener("click", redeemCode);
  $("#loginEmailInput").addEventListener("keydown", submitOnEnter(sendLoginCode));
  $("#loginCodeInput").addEventListener("keydown", submitOnEnter(verifyLoginCode));
  $("#redeemCodeInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      redeemCode();
    }
  });
  $("#saveConfigButton")?.addEventListener("click", saveConfigFromForm);
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
  $("#announcementToggle").addEventListener("click", () => {
    const popup = $("#announcementPopup");
    if (!popup) return;
    const willOpen = popup.hidden;
    popup.hidden = !willOpen;
    if (willOpen) markAnnouncementsSeen();
  });
  $("#closeAnnouncement").addEventListener("click", closeAnnouncementPopup);
  $("#openAnnouncementAdmin")?.addEventListener("click", openAnnouncementAdminPanel);
  $("#unlockCodeAdminButton").addEventListener("click", unlockCodeAdminPanel);
  $("#codeAdminPassword").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    unlockCodeAdminPanel();
  });
  $$(".admin-nav-button").forEach((button) => {
    button.addEventListener("click", () => selectCodeAdminSection(button.dataset.adminSection || "codes"));
  });
  $("#publishAnnouncementButton").addEventListener("click", publishAnnouncementFromPanel);
  $("#announcementAdminList")?.addEventListener("click", onAnnouncementAdminClick);
  $("#closeLogs").addEventListener("click", () => $("#logsPanel").classList.remove("open"));
  $("#clearLogsButton").addEventListener("click", clearGenerationLogs);
  $("#apiStatsList")?.addEventListener("click", onApiStatsListClick);
  $("#refreshStatsButton")?.addEventListener("click", refreshSiteStatsFromPanel);
  $("#clearStatsButton").addEventListener("click", clearApiStats);
  $("#closeCodeAdmin").addEventListener("click", closeCodeAdminPanel);
  $("#generateCodesButton").addEventListener("click", generateRedeemCodesFromPanel);
  $("#copyCodesButton").addEventListener("click", copyGeneratedCodes);
  $("#downloadCodesButton").addEventListener("click", downloadLastCodeCsv);
  $("#codeAdminAmount").addEventListener("input", syncCodeAdminLabel);
  $("#loadCustomApiConfigButton")?.addEventListener("click", () => loadCustomApiAdminConfig({ silent: false, globalForm: true }));
  $("#saveCustomApiConfigButton")?.addEventListener("click", saveCustomApiAdminConfig);
  $("#applyGlobalApiConfigButton")?.addEventListener("click", applyCustomApiAsGlobal);
  $("#adminCustomRequestFormat")?.addEventListener("change", updateAdminCustomTemplateVisibility);
  $("#adminCustomHistoryList")?.addEventListener("click", onAdminCustomHistoryClick);
  $("#cancelGenerateButton").addEventListener("click", cancelGeneration);
  $("#generationProgress").addEventListener("click", onProgressClick);
  $("#ratioSelect").addEventListener("change", syncSizeOptions);
  $("#multiImageMode")?.addEventListener("change", saveMultiImageMode);
  $("#requestFormat")?.addEventListener("change", updateTemplateVisibility);
  $("#configHistoryList")?.addEventListener("click", onConfigHistoryClick);
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
  window.addEventListener("pointercancel", onDetailPointerUp);
  window.addEventListener("keydown", onGlobalKeyDown);
  document.addEventListener("input", onHiddenPhraseInput, true);
  document.addEventListener("compositionend", onHiddenPhraseInput, true);
  document.addEventListener("paste", () => setTimeout(() => onHiddenPhraseInput(), 0), true);
  $("#promptInput").addEventListener("input", (event) => autoGrow(event.target));
  $("#promptInput").addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      generateImages();
    }
  });
  window.addEventListener("resize", debounce(scheduleResultMasonryLayout, 120));
  if (new URLSearchParams(location.search).has("admin")) openCodeAdminPanel();
  if (new URLSearchParams(location.search).has("announce")) openAnnouncementAdminPanel();
}

function submitOnEnter(callback) {
  return (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    callback();
  };
}

function loadWalletSessionToken() {
  billingState.sessionToken = readWalletSessionToken();
}

function readWalletSessionToken() {
  try {
    return localStorage.getItem(WALLET_SESSION_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function persistWalletSessionToken(token) {
  billingState.sessionToken = String(token || "").trim();
  try {
    if (billingState.sessionToken) localStorage.setItem(WALLET_SESSION_TOKEN_KEY, billingState.sessionToken);
    else localStorage.removeItem(WALLET_SESSION_TOKEN_KEY);
  } catch {}
}

function clearWalletSessionToken() {
  persistWalletSessionToken("");
}

function currentWalletSessionToken() {
  return billingState.sessionToken || readWalletSessionToken();
}

function walletSessionChanged(snapshot) {
  return snapshot !== currentWalletSessionToken();
}

function loadLoginCodeCooldown() {
  try {
    const until = Number(localStorage.getItem(LOGIN_CODE_COOLDOWN_KEY) || 0);
    loginCodeCooldownUntil = Number.isFinite(until) && until > Date.now() ? until : 0;
  } catch {
    loginCodeCooldownUntil = 0;
  }
  if (loginCodeCooldownUntil) {
    startLoginCodeCooldownTimer();
  } else {
    updateSendLoginCodeButton();
  }
}

function persistLoginCodeCooldown(until) {
  loginCodeCooldownUntil = Math.max(0, Number(until) || 0);
  try {
    if (loginCodeCooldownUntil > Date.now()) localStorage.setItem(LOGIN_CODE_COOLDOWN_KEY, String(loginCodeCooldownUntil));
    else localStorage.removeItem(LOGIN_CODE_COOLDOWN_KEY);
  } catch {}
}

function startLoginCodeCooldown(seconds = LOGIN_CODE_RESEND_COOLDOWN_SECONDS) {
  const duration = Math.max(1, Number(seconds) || LOGIN_CODE_RESEND_COOLDOWN_SECONDS);
  persistLoginCodeCooldown(Date.now() + duration * 1000);
  startLoginCodeCooldownTimer();
}

function startLoginCodeCooldownTimer() {
  clearInterval(loginCodeCooldownTimer);
  loginCodeCooldownTimer = setInterval(() => {
    if (Date.now() >= loginCodeCooldownUntil) {
      persistLoginCodeCooldown(0);
      clearInterval(loginCodeCooldownTimer);
      loginCodeCooldownTimer = null;
    }
    updateSendLoginCodeButton();
  }, 1000);
  updateSendLoginCodeButton();
}

function getLoginCodeCooldownRemaining() {
  return Math.max(0, Math.ceil((loginCodeCooldownUntil - Date.now()) / 1000));
}

function updateSendLoginCodeButton() {
  const button = $("#sendLoginCodeButton");
  if (!button) return;
  const remaining = getLoginCodeCooldownRemaining();
  const locked = remaining > 0;
  button.disabled = locked;
  if (locked) {
    button.innerHTML = `<i data-icon="rotate"></i><span>${remaining}s 后重发</span>`;
  } else {
    button.innerHTML = `<i data-icon="rotate"></i><span>发送验证码</span>`;
  }
  renderIcons();
}

function onModelSelect() {
  const input = $("#modelName");
  if (input) input.value = FIXED_MODEL_NAME;
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
  if (usePlatformApi) {
    await ensurePlatformReadyForGeneration();
  }
  if (usePlatformApi && billingState.configLoaded && !billingState.platformEnabled) {
    $("#walletPanel").classList.add("open");
    showToast("站点 API 暂未配置，请联系站长处理");
    return;
  }
  if (usePlatformApi && !billingState.authenticated) {
    $("#walletPanel").classList.add("open");
    showToast(currentWalletSessionToken() ? "登录状态还在同步，请稍后再点生成" : "请先用邮箱登录后再使用站点 API");
    setTimeout(() => $("#loginEmailInput")?.focus(), 0);
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
    else openCustomApiAdminSection();
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
    multiImageMode: "single",
    quality: $("#qualitySelect").value,
    seed: $("#seedInput").value.trim(),
    model: getModelName(),
    referenceImages: mode === "image" ? [...state.references] : [],
    generationId,
    abortSignal: generationAbortController.signal,
    apiProvider: usePlatformApi ? "platform" : "custom",
    platformPriceCents: usePlatformApi ? billingState.priceCents : 0,
  };
  options.apiDisplayName = currentApiDisplayName(endpoint, options);
  if (usePlatformApi && billingState.configLoaded) {
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
    updateProgress(generationCancelled ? "生成已取消" : "生成完成", `${finalMessage}，用时 ${formatDurationLabel(Date.now() - progressStartedAt)}`, 100, {
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

async function ensurePlatformReadyForGeneration() {
  const noticeTimer = setTimeout(() => showToast("正在同步钱包，请稍候..."), 700);
  try {
    if (billingReadyPromise) {
      await Promise.race([billingReadyPromise, wait(GENERATION_READY_WAIT_MS)]);
    }
    if (!billingState.platformEnabled) {
      await Promise.race([loadBillingConfig(), wait(GENERATION_READY_WAIT_MS)]);
    }
    if (currentWalletSessionToken() && !billingState.authenticated) {
      await Promise.race([refreshBilling(), wait(GENERATION_READY_WAIT_MS)]);
    }
    await ensurePlatformBrowserGlobalConfigLoaded();
    warmDirectApiBase();
  } catch (error) {
    console.warn("生成前钱包同步失败", error);
  } finally {
    clearTimeout(noticeTimer);
  }
}

async function requestImages(endpoint, options) {
  endpoint = normalizeEndpointBeforeRequest(endpoint, options);
  const headers = {};
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  const requestFormat = isPlatformApiSelected() ? billingState.platformRequestFormat || "openai" : config.requestFormat;

  if (requestFormat === "json") {
    headers["Content-Type"] = "application/json";
    const template = isPlatformApiSelected() ? billingState.platformCustomTemplate || defaultTemplate : config.customTemplate || defaultTemplate;
    const body = renderTemplate(template, options);
    return sendAndParseImageRequest(
      endpoint,
      {
        method: "POST",
        headers,
        bodyType: "json",
        body,
        signal: options.abortSignal,
        billingCount: options.count,
        billingMode: options.mode,
        billingModel: options.model,
        billingGenerationId: options.generationId,
        billingRequestId: platformBillingRequestId(options),
      },
      options,
      { variant: "custom-json", label: requestLogLabel(options) },
    );
  }

  const variants = imageRequestVariants(options);
  let lastError = null;

  for (const variantInfo of variants) {
    try {
      const payload =
        options.mode === "text" || !options.referenceImages.length
          ? await requestTextImages(endpoint, headers, options, variantInfo.payloadVariant)
          : await requestEditImages(endpoint, headers, options, variantInfo.payloadVariant, variantInfo.fileFieldMode, variantInfo.label);
      if (normalizeImages(payload, endpoint).length) return payload;
      lastError = new Error(`接口返回成功，但没有找到图片字段：${previewPayload(payload)}`);
      break;
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithMinimalPayload(cleanErrorMessage(error), variantInfo.payloadVariant, options)) break;
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
      endpoint: "/api/generate/platform",
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
        if ($("#editEndpoint")) $("#editEndpoint").value = corrected;
        if ($("#adminCustomEditEndpoint")) $("#adminCustomEditEndpoint").value = corrected;
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
      if ($("#editEndpoint")) $("#editEndpoint").value = inferred;
      if ($("#adminCustomEditEndpoint")) $("#adminCustomEditEndpoint").value = inferred;
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
      billingRequestId: platformBillingRequestId(options),
    },
    options,
    { variant, label: requestLogLabel(options) },
  );
}

function imageRequestVariants(options = {}) {
  if (options.mode === "image" && (options.referenceImages || []).length) {
    return [
      { payloadVariant: "compatible", fileFieldMode: "array", label: "compatible-array" },
      { payloadVariant: "compatible", fileFieldMode: "single", label: "compatible-single" },
      { payloadVariant: "compatible", fileFieldMode: "indexed", label: "compatible-indexed" },
      { payloadVariant: "minimal", fileFieldMode: "single", label: "minimal-single" },
      { payloadVariant: "bare", fileFieldMode: "single", label: "bare-single" },
    ];
  }
  return [
    { payloadVariant: "compatible", fileFieldMode: "single", label: "compatible" },
    { payloadVariant: "minimal", fileFieldMode: "single", label: "minimal" },
    { payloadVariant: "bare", fileFieldMode: "single", label: "bare" },
  ];
}

async function requestEditImages(endpoint, headers, options, variant, fileFieldMode = "single", variantLabel = variant) {
  const fields = buildImageFormFields(options, variant, endpoint);
  const requestImages = await normalizeReferenceImagesForRequest(options.referenceImages || []);
  const files = requestImages.map((image, index) => ({
    field: imageUploadFieldName(endpoint, index, fileFieldMode),
    filename: image.name || `reference-${index + 1}.png`,
    dataUrl: image.dataUrl,
    normalizedForApi: Boolean(image.normalizedForApi),
    originalBytes: image.originalBytes || "",
    outputBytes: image.outputBytes || "",
  }));

  return sendAndParseImageRequest(
    endpoint,
    {
      method: "POST",
      headers,
      bodyType: "multipart",
      fields,
      files,
      payloadVariant: variant,
      fileFieldMode,
      signal: options.abortSignal,
      billingCount: options.count,
      billingMode: options.mode,
      billingModel: options.model,
      billingGenerationId: options.generationId,
      billingRequestId: platformBillingRequestId(options),
    },
    options,
    { variant: variantLabel, label: requestLogLabel(options) },
  );
}

function imageUploadFieldName(endpoint, index, mode = "single") {
  if (mode === "array") return "image[]";
  if (mode === "indexed") return `image[${index}]`;
  return index === 0 ? "image" : `image_${index + 1}`;
}

async function normalizeReferenceImagesForRequest(images = []) {
  return Promise.all(images.map((image, index) => normalizeReferenceImageForApi(image, index)));
}

async function normalizeReferenceImageForApi(image, index = 0) {
  const dataUrl = String(image?.dataUrl || "");
  if (!dataUrl.startsWith("data:image/")) return image;
  try {
    const originalBlob = dataUrlToBlob(dataUrl);
    if (!/^image\/(?:png|jpe?g|webp)$/i.test(originalBlob.type || "")) return image;
    const dimensions = await imageBlobDimensions(originalBlob);
    const longest = Math.max(dimensions.width || 1, dimensions.height || 1);
    if (originalBlob.size <= REFERENCE_API_MAX_BYTES && longest <= REFERENCE_API_MAX_DIMENSION) return image;

    const compressedBlob = await compressReferenceImageBlob(originalBlob, dimensions);
    return {
      ...image,
      name: replaceImageExtension(image?.name || `reference-${index + 1}.png`, "jpg"),
      dataUrl: await blobToDataUrl(compressedBlob),
      normalizedForApi: true,
      originalBytes: originalBlob.size,
      outputBytes: compressedBlob.size,
      originalWidth: dimensions.width,
      originalHeight: dimensions.height,
    };
  } catch (error) {
    console.warn("参考图压缩失败，继续使用原图", error);
    return image;
  }
}

async function imageBlobDimensions(blob) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width || 1, height: bitmap.height || 1 };
    if (typeof bitmap.close === "function") bitmap.close();
    return dimensions;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片尺寸读取失败"));
    };
    image.src = url;
  });
}

async function compressReferenceImageBlob(blob, dimensions) {
  const longest = Math.max(dimensions.width || 1, dimensions.height || 1);
  const scale = longest > REFERENCE_API_MAX_DIMENSION ? REFERENCE_API_MAX_DIMENSION / longest : 1;
  const width = Math.max(1, Math.round((dimensions.width || 1) * scale));
  const height = Math.max(1, Math.round((dimensions.height || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持图片压缩");
  const bitmap = await imageBlobToDrawable(blob);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  if (typeof bitmap.close === "function") bitmap.close();

  let output = null;
  for (
    let quality = REFERENCE_API_JPEG_QUALITY_START;
    quality >= REFERENCE_API_JPEG_QUALITY_MIN - 0.001;
    quality -= REFERENCE_API_JPEG_QUALITY_STEP
  ) {
    output = await canvasToBlob(canvas, "image/jpeg", Math.max(REFERENCE_API_JPEG_QUALITY_MIN, quality));
    if (output.size <= REFERENCE_API_MAX_BYTES) break;
  }
  if (!output) throw new Error("参考图压缩失败");
  return output;
}

async function imageBlobToDrawable(blob) {
  if ("createImageBitmap" in window) return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片载入失败"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("图片压缩失败"));
    }, type, quality);
  });
}

function replaceImageExtension(filename, extension) {
  const clean = String(filename || "").trim() || "reference.png";
  return /\.[a-z0-9]{1,8}$/i.test(clean) ? clean.replace(/\.[a-z0-9]{1,8}$/i, `.${extension}`) : `${clean}.${extension}`;
}

function buildImageJsonBody(options, variant) {
  const body = {
    model: options.model,
    prompt: buildPrompt(options),
  };
  appendCoreImageFields(body, options, variant);
  appendCompatibleImageFields(body, options, variant);
  return body;
}

function buildImageFormFields(options, variant, endpoint = "") {
  const fields = {
    model: options.model,
    prompt: buildPrompt(options),
  };
  appendCoreImageFields(fields, options, variant);
  appendCompatibleImageFields(fields, options, variant);
  appendImageEditCompatibilityFields(fields, options, variant);
  if (fields.n != null) fields.n = String(fields.n);
  if (fields.seed != null) fields.seed = String(fields.seed);
  return fields;
}

function appendImageEditCompatibilityFields(fields, options, variant) {
  if (variant !== "compatible" || options.mode !== "image") return;
  if (!fields.size) fields.size = String(options.size || "").trim() || "auto";
  fields.output_format = "png";
  fields.moderation = "auto";
  if (!fields.quality) fields.quality = "auto";
  fields.response_format = "b64_json";
}

function appendCoreImageFields(target, options, variant) {
  if (variant === "bare") return;
  const size = effectiveRequestSize(options);
  if (size) target.size = size;
  if (options.count > 1) target.n = options.count;
}

function effectiveRequestSize(options = {}) {
  const selected = String(options.size || "").trim();
  if (selected && selected !== "auto") return selected;
  return "";
}

function inferAutoRequestSize(options = {}) {
  const prompt = `${options.prompt || ""}\n${options.negativePrompt || ""}`;
  if (/海报|竖版|竖屏|手机壁纸|小红书|封面|portrait|poster|vertical|9:16|2:3/i.test(prompt)) {
    return "1024x1536";
  }
  if (/横版|横屏|宽屏|banner|横幅|landscape|wide|16:9|3:2/i.test(prompt)) {
    return "1536x1024";
  }
  return "";
}

function appendCompatibleImageFields(target, options, variant) {
  if (variant !== "compatible") return;
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

function platformBillingRequestId(options = {}) {
  const generationId = String(options.generationId || makeId()).replace(/[^\w-]/g, "");
  const index = Math.max(1, Number(options.batchIndex || 1));
  const count = Math.max(1, Number(options.count || 1));
  return `gen_${generationId}_${index}_${count}`;
}

function createGenerationContext(options) {
  return {
    options,
    created: [],
    committedIndexes: new Set(),
  };
}

async function commitGeneratedImage(src, options, index, context) {
  if (!src) return null;
  if (context?.committedIndexes?.has(index)) return null;
  context?.committedIndexes?.add(index);
  const result = await createResult(src, options, index);
  state.latestGenerationId = options.generationId || "";
  state.results.unshift(result);
  if (context) context.created.push(result);
  updateRunningGenerationImageCount(context?.created?.length || state.results.filter((item) => item.generationId === options.generationId).length);
  renderResults();
  void finalizeResultAsset(result.id, src, options);
  void persistState();
  const total = Math.max(1, Number(options.batchTotal || options.count || 1));
  const generated = Math.min(total, context?.created?.length || 1);
  updateProgress("已生成图片", `已生成 ${generated}/${total} 张，正在继续整理结果`, Math.max(currentProgress, 84), {
    generated,
    total,
  });
  await settlePlatformImage(result, options, index, context);
  return result;
}

function updateRunningGenerationImageCount(imageCount) {
  if (!activeGenerationLog) return;
  activeGenerationLog.imageCount = Math.max(Number(activeGenerationLog.imageCount || 0), Number(imageCount || 0));
  saveGenerationLogs();
  renderGenerationLogs();
}

function applyPlatformRequestCost(options, index, amountCents = null) {
  if (options.apiProvider !== "platform") return;
  const requestEntry = findRequestLogEntry(options, index);
  if (!requestEntry) return;
  const priceCents = amountCents == null ? resolvePlatformPriceCents(options) : Math.max(0, Math.round(Number(amountCents) || 0));
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

async function settlePlatformImage(result, options, index, context) {
  if (options.apiProvider !== "platform") return;
  const ticket = options.platformTicket || context?.platformTicket || "";
  if (!ticket) {
    showToast("图片已生成，但结算票据缺失，请联系站长核对流水");
    return;
  }
  const requestId = platformSettlementRequestId(options, result, index);
  let lastError = null;
  try {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await apiFetchPreferDirect("/api/generate/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket,
            imageId: result.id,
            requestId,
            model: options.model || getModelName(),
          }),
          timeoutMs: FAST_API_TIMEOUT_MS,
        }, {
          directFirst: true,
          timeoutMs: FAST_API_TIMEOUT_MS,
          label: "扣费结算",
        });
        const payload = await readJsonResponse(response);
        if (!response.ok) throw new Error(payload?.error?.message || `结算失败：HTTP ${response.status}`);
        if (Number.isFinite(Number(payload.balanceCents))) {
          billingState.balanceCents = Number(payload.balanceCents);
        }
        applyPlatformRequestCost(options, index, Number(payload.chargedCents || options.platformPriceCents || billingState.priceCents || 0));
        renderWallet();
        if (billingState.authenticated) {
          const sessionSnapshot = currentWalletSessionToken();
          loadBillingLedger({ silent: true, sessionSnapshot })
            .then(() => {
              if (!walletSessionChanged(sessionSnapshot)) renderWallet();
            })
            .catch(() => {});
        }
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) await wait(700 * attempt);
      }
    }
    throw lastError || new Error("结算失败");
  } catch (error) {
    applyPlatformRequestCost(options, index, 0);
    showToast(`图片已生成，但扣费结算失败：${error.message || "请联系站长"}`);
  }
}

function platformSettlementRequestId(options, result, index) {
  return platformBillingRequestId({
    generationId: options.generationId || result.generationId || result.id,
    batchIndex: (Number(options.batchIndex) || index + 1),
    count: 1,
  });
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
    if (payload?.platformTicket) {
      options.platformTicket = payload.platformTicket;
      options.platformPriceCents = payload.platformPriceCents || options.platformPriceCents;
      if (context) context.platformTicket = payload.platformTicket;
    }
    images = normalizeImages(payload, endpoint).slice(0, desired);
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
          if (payload?.platformTicket) {
            oneOptions.platformTicket = payload.platformTicket;
            oneOptions.platformPriceCents = payload.platformPriceCents || oneOptions.platformPriceCents;
            if (context) context.platformTicket = payload.platformTicket;
          }
          const source = normalizeImages(payload, endpoint)[0] || "";
          if (!source) throw new Error("接口没有返回图片");
          images[index] = source;
          await commitGeneratedImage(source, oneOptions, absoluteIndex, context);
          break;
        } catch (error) {
          lastError = cleanErrorMessage(error);
          if (
            generationCancelled ||
            isAbortError(error) ||
            attempt >= SINGLE_IMAGE_MAX_ATTEMPTS ||
            !shouldRetrySingleImageError(lastError, options)
          ) {
            break;
          }
          const retryDelay = options.apiProvider === "platform" ? PLATFORM_GENERATION_RETRY_DELAY_MS : 900;
          updateProgress("重试单张生成", `第 ${absoluteIndex + 1}/${total} 张失败：${lastError}，正在重试`, currentProgress, {
            generated: offset + images.filter(Boolean).length,
            total,
          });
          await wait(retryDelay);
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
  if (options.apiProvider === "platform") return true;
  if (desired <= PLATFORM_MAX_BATCH_REQUEST_COUNT) return false;
  return true;
}

function isFatalImageError(message) {
  return /\b(401|403|429)\b|unauthorized|authentication|invalid api key|forbidden|permission|quota|billing|rate limit/i.test(
    message,
  );
}

function shouldRetrySingleImageError(message, options = {}) {
  return (
    !isFatalImageError(message) &&
    !(options.apiProvider === "platform" && isUncertainChargedError(message)) &&
    /\b(500|502|503|504|520|522|524)\b|timeout|timed out|bad gateway|gateway|temporar|network|failed to fetch|没有返回图片|no image|internal_error|server_error|stream error|received from peer|rst_stream|reset/i.test(
      message,
    )
  );
}

function isUncertainChargedError(message) {
  return /failed to fetch|network|timeout|timed out|\b(504|524)\b|edgeone_proxy_timeout|代理等待上游生图超时|上游接口超时|请求超时|连接中断|connection|aborted|tcp|reset|received from peer|rst_stream|stream error/i.test(
    message || "",
  );
}

function shouldRetryWithMinimalPayload(message, variant, options = {}) {
  if (Number(options.count || 1) > 1 || isFatalImageError(message) || isUncertainChargedError(message)) return false;
  const retryableEditError = /\b(400|405|408|409|422|500|502|503|504|520|522|524)\b|bad gateway|gateway timeout|service unavailable|internal server error|server error|platform_failed|站点 API 生成失败|生成失败|上游服务异常|没有返回图片|no image|image proxy failed|upstream request failed/i;
  const editFormatError = /image proxy failed|no image|missing|required|file|multipart|form[- ]?data|field|invalid|unknown|unrecognized|unsupported|not support|quality|size|seed|\bn\b|count|parameter|param|response_format|output_format|moderation/i;
  if (options.mode === "image" && variant === "compatible") {
    return editFormatError.test(message) || retryableEditError.test(message);
  }
  if (options.mode === "image" && variant === "minimal") {
    return (
      /no image|missing|required|image|file|multipart|form[- ]?data|field|invalid|unknown|unrecognized|unsupported|not support|size|dimension|resolution|parameter|param/i.test(message) ||
      retryableEditError.test(message)
    );
  }
  if (variant === "compatible") {
    return /invalid|unsupported|not support|quality|size|seed|\bn\b|count|parameter|param/i.test(message);
  }
  if (variant === "minimal") {
    return /invalid|unsupported|not support|size|dimension|resolution|parameter|param/i.test(message);
  }
  return false;
}

function isAbortError(error) {
  return error?.name === "AbortError" || /abort|aborted|取消/i.test(error?.message || String(error));
}

async function sendAndParseImageRequest(endpoint, request, options, meta = {}) {
  const requestLog = startRequestLog(endpoint, request, options, meta);
  const billingRequestId = request.billingRequestId || options.billingRequestId || (options.generationId ? platformBillingRequestId(options) : "");
  try {
    const response = await sendImageRequest(endpoint, request);
    const statsEndpoint = response.platformStatsEndpoint || endpoint;
    const statsOptions = {
      ...options,
      billingRequestId,
      statsApiKey: response.platformStatsApiKey || options.statsApiKey || config.apiKey,
      model: response.platformStatsModel || options.model || "",
      apiDisplayName: response.platformStatsDisplayName || response.platformDisplayName || options.apiDisplayName,
    };
    const imageBaseUrl = response.platformStatsEndpoint || endpoint;
    const payload = tagPayloadImageBaseUrl(await parseApiResponse(response, requestLog, imageBaseUrl), imageBaseUrl);
    if (isPlatformApiSelected()) refreshBilling();
    await recordApiUsage(statsEndpoint, statsOptions, requestLog, {
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
    await recordApiUsage(endpoint, { ...options, billingRequestId, statsApiKey: options.statsApiKey || config.apiKey }, requestLog, {
      status: "failed",
      error: error.message || String(error),
    });
    throw error;
  }
}

async function sendImageRequest(endpoint, request) {
  if (isPlatformApiSelected()) {
    return fetchPlatformServerImageRequest(endpoint, request);
  }

  return fetchCustomImageRequest(endpoint, request);
}

async function fetchCustomImageRequest(endpoint, request, transportMode = config.transportMode) {
  const preferredMode = transportMode === "direct" ? "direct" : "proxy";
  const modes = preferredMode === "direct" ? ["direct", "proxy"] : ["proxy", "direct"];
  let lastError = null;
  let lastMode = "";

  for (const mode of modes) {
    const startedAt = Date.now();
    try {
      const response =
        mode === "direct"
          ? await fetchDirectImageRequest(endpoint, request)
          : await fetchCustomProxyImageRequest(endpoint, request);
      if (response.ok || !shouldSwitchCustomTransport(response, mode, endpoint, Date.now() - startedAt, preferredMode)) {
        if (lastError && mode !== preferredMode) {
          showToast(mode === "proxy" ? "浏览器直连失败，已切到服务器代理" : "服务器代理异常，已尝试浏览器直连");
        }
        return response;
      }
      lastMode = mode;
      lastError = new Error(`${customTransportLabel(mode)}返回 HTTP ${response.status}`);
    } catch (error) {
      lastMode = mode;
      lastError = error;
      if (!shouldSwitchCustomTransportError(error, Date.now() - startedAt)) break;
    }
  }

  const prefix = lastMode ? `${customTransportLabel(lastMode)}失败：` : "";
  throw new Error(`${prefix}${cleanErrorMessage(lastError) || "请求失败"}`);
}

async function fetchCustomProxyImageRequest(endpoint, request) {
  const { signal, ...proxyRequest } = request;
  const password = adminPassword();
  if (password) {
    return apiFetchPreferDirect("/api/admin/proxy-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ endpoint, request: proxyRequest }),
      signal,
      timeoutMs: CUSTOM_API_PROXY_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: CUSTOM_API_PROXY_TIMEOUT_MS,
      label: "自定义 API 代理",
    });
  }

  const proxyResponse = await fetchWithTimeout("/api/proxy-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, request: proxyRequest }),
    signal,
  }, CUSTOM_API_PROXY_TIMEOUT_MS);
  return proxyResponse;
}

function customTransportLabel(mode) {
  return mode === "direct" ? "浏览器直连" : "服务器代理";
}

function shouldSwitchCustomTransport(response, mode, endpoint = "", elapsedMs = 0, preferredMode = config.transportMode) {
  if (!response) return false;
  if (elapsedMs > 8000) return false;
  if (mode === "direct") {
    return response.status === 405 || isRetryableHttpStatus(response.status);
  }
  if (requiresServerProxyEndpoint(endpoint)) return false;
  return shouldFallbackToDirect(response, preferredMode);
}

function shouldSwitchCustomTransportError(error, elapsedMs = 0) {
  if (elapsedMs > 8000) return false;
  return isRetryableFetchError(error) || /cors|cross-?origin|preflight/i.test(error?.message || String(error));
}

async function fetchPlatformServerImageRequest(endpoint, request) {
  await ensurePlatformBrowserGlobalConfigLoaded();
  const browserConfig = platformBrowserGlobalConfig(request);
  if (browserConfig) {
    return fetchPlatformBrowserImageRequest(request, browserConfig);
  }

  const { signal, billingCount, billingMode, billingModel, billingGenerationId, billingRequestId, ...serverRequest } = request;
  const ticket = await getPlatformGenerationTicket({
    mode: billingMode || $("#modeSelect").value,
    count: billingCount || 1,
    model: billingModel || getModelName(),
    signal,
  });
  const payload = {
    mode: billingMode || $("#modeSelect").value,
    count: billingCount || 1,
    model: billingModel || getModelName(),
    requestId: billingRequestId || platformBillingRequestId({ generationId: billingGenerationId, count: billingCount }),
    ticket: ticket.ticket,
    request: {
      ...serverRequest,
      headers: sanitizePlatformBrowserHeaders(serverRequest.headers || {}),
    },
  };
  const { response, url: platformUrl } = await fetchPlatformGeneration(payload, signal);
  response.platformTicket = ticket.ticket;
  response.platformPriceCents = ticket.priceCents;
  response.platformStatsEndpoint = platformUrl;
  response.platformStatsDisplayName = ticket.displayName || billingState.platformDisplayName;
  response.platformStatsModel = billingModel || getModelName();
  return response;
}

async function fetchPlatformBrowserImageRequest(request, platformConfig) {
  const { signal, billingCount, billingMode, billingModel, billingGenerationId, billingRequestId, ...serverRequest } = request;
  const mode = billingMode || $("#modeSelect").value;
  const endpoint = mode === "image"
    ? ((platformConfig.editEndpoint || "").trim() || inferEditEndpoint(platformConfig.textEndpoint || ""))
    : (platformConfig.textEndpoint || "").trim();
  if (!endpoint) throw new Error("站点 API 地址不完整");
  const ticket = await getPlatformGenerationTicket({
    mode,
    count: billingCount || 1,
    model: billingModel || getModelName(),
    signal,
  });
  const headers = {
    ...(serverRequest.headers || {}),
    Authorization: `Bearer ${platformConfig.apiKey}`,
  };
  const response = await fetchCustomImageRequest(endpoint, {
    ...serverRequest,
    headers,
    signal,
  }, platformConfig.transportMode || "proxy");
  response.platformTicket = ticket.ticket;
  response.platformPriceCents = ticket.priceCents;
  response.platformStatsEndpoint = endpoint;
  response.platformStatsApiKey = platformConfig.apiKey;
  response.platformStatsDisplayName = ticket.displayName || billingState.platformDisplayName;
  response.platformStatsModel = billingModel || getModelName();
  return response;
}

async function ensurePlatformBrowserGlobalConfigLoaded() {
  if (!adminPassword()) return;
  const globalConfig = customDebugState.global || {};
  if (globalConfig.apiKey && globalConfig.textEndpoint) return;
  if (!platformBrowserGlobalLoadPromise) {
    platformBrowserGlobalLoadPromise = loadPlatformBrowserGlobalConfig().finally(() => {
      platformBrowserGlobalLoadPromise = null;
    });
  }
  try {
    await platformBrowserGlobalLoadPromise;
  } catch (error) {
    console.warn("Platform global config preload failed", error);
  }
}

async function loadPlatformBrowserGlobalConfig() {
  const response = await apiFetchPreferDirect("/api/admin/custom-api", {
    headers: { "X-Admin-Password": adminPassword() },
    timeoutMs: ADMIN_API_TIMEOUT_MS,
  }, {
    directFirst: true,
    timeoutMs: ADMIN_API_TIMEOUT_MS,
    label: "Global API config preload",
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Global API config preload failed: HTTP ${response.status}`);
  }
  const serverConfig = payload.config || {};
  const globalConfig = payload.global || {};
  customDebugState.loaded = true;
  customDebugState.current = serverConfig;
  customDebugState.history = Array.isArray(payload.history) ? payload.history : [];
  customDebugState.global = globalConfig;
  applyGlobalApiInfo(globalConfig);
  renderAdminCustomHistory();
}

function platformBrowserGlobalConfig(request = {}) {
  const globalConfig = customDebugState.global || {};
  if (!adminPassword() || !globalConfig.apiKey || !globalConfig.textEndpoint) return null;
  const mode = request.billingMode || $("#modeSelect").value;
  const textEndpoint = String(globalConfig.textEndpoint || "").trim();
  const editEndpoint = String(globalConfig.editEndpoint || "").trim();
  const endpoint = mode === "image" ? (editEndpoint || inferEditEndpoint(textEndpoint)) : textEndpoint;
  if (!endpoint) return null;
  return {
    ...globalConfig,
    textEndpoint,
    editEndpoint,
    transportMode: normalizeCustomTransportMode(
      textEndpoint,
      editEndpoint,
      matchingAdminCustomTransportMode(globalConfig) || globalConfig.transportMode || billingState.platformTransportMode || "proxy",
    ),
  };
}

function matchingAdminCustomTransportMode(globalConfig = {}) {
  const candidates = [customDebugState.current, ...(customDebugState.history || [])].filter(Boolean);
  const globalKey = String(globalConfig.apiKey || "").trim();
  const globalText = String(globalConfig.textEndpoint || "").trim();
  const globalEdit = String(globalConfig.editEndpoint || "").trim();
  const match = candidates.find((item) => {
    if (!["direct", "proxy"].includes(item.transportMode)) return false;
    return (
      String(item.apiKey || "").trim() === globalKey &&
      String(item.textEndpoint || "").trim() === globalText &&
      String(item.editEndpoint || "").trim() === globalEdit
    );
  });
  return match?.transportMode || "";
}

async function fetchPlatformGeneration(payload, signal) {
  const url = platformDirectUrl("/api/generate/platform");
  try {
    const response = await apiFetchPreferDirect("/api/generate/platform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
      signal,
      timeoutMs: CUSTOM_API_PROXY_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: CUSTOM_API_PROXY_TIMEOUT_MS,
      label: "站点 API 生图",
      noHttpFallback: true,
      noFetchErrorFallback: true,
      maxFetchErrorFallbackMs: 8000,
    });
    return { response, url: response.apiFetchUrl || url };
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`站点 API 请求失败：${cleanErrorMessage(error) || "请检查网络后重试"}`);
  }
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

async function getPlatformGenerationTicket(options = {}) {
  const requestBody = {
    mode: options.mode || $("#modeSelect").value,
    count: options.count || 1,
    model: options.model || getModelName(),
  };
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await apiFetchPreferDirect("/api/generate/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: options.signal,
        timeoutMs: FAST_API_TIMEOUT_MS,
      }, {
        directFirst: true,
        timeoutMs: FAST_API_TIMEOUT_MS,
        label: "生成票据获取",
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload?.error?.message || `生成票据获取失败：HTTP ${response.status}`);
      if (!payload.ticket) throw new Error("生成票据缺失，请重试");
      if (payload.directBaseUrl) billingState.directBaseUrl = normalizeDirectApiBase(payload.directBaseUrl);
      billingState.priceCents = Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
      billingState.platformDisplayName = normalizeApiDisplayName(payload.displayName || billingState.platformDisplayName);
      if (Number.isFinite(Number(payload.balanceCents))) billingState.balanceCents = Number(payload.balanceCents);
      renderWallet();
      return {
        ticket: payload.ticket,
        priceCents: Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS),
        displayName: billingState.platformDisplayName,
      };
    } catch (error) {
      lastError = error;
      if (!isRetryableDirectConfigError(error, attempt)) break;
      await wait(500 * attempt);
    }
  }
  throw lastError || new Error("生成票据获取失败，请重试");
}

async function getPlatformDirectConfig(options = {}) {
  const requestBody = {
    mode: options.mode || $("#modeSelect").value,
    count: options.count || 1,
    model: options.model || getModelName(),
  };
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await apiFetchPreferDirect("/api/generate/direct-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: options.signal,
        timeoutMs: FAST_API_TIMEOUT_MS,
      }, {
        directFirst: true,
        timeoutMs: FAST_API_TIMEOUT_MS,
        label: "站点 API 配置获取",
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload?.error?.message || `站点 API 配置获取失败：HTTP ${response.status}`);
      if (!payload.ticket) throw new Error("站点 API 配置不完整，请联系站长");
      billingState.priceCents = Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
      billingState.platformDisplayName = normalizeApiDisplayName(payload.displayName || billingState.platformDisplayName);
      if (Number.isFinite(Number(payload.balanceCents))) billingState.balanceCents = Number(payload.balanceCents);
      renderWallet();
      return {
        ticket: payload.ticket,
        priceCents: Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS),
        displayName: billingState.platformDisplayName,
      };
    } catch (error) {
      lastError = error;
      if (!isRetryableDirectConfigError(error, attempt)) break;
      await wait(700 * attempt);
    }
  }
  throw lastError || new Error("站点 API 配置获取失败");
}

function isRetryableDirectConfigError(error, attempt) {
  if (attempt >= 3) return false;
  const text = cleanErrorMessage(error);
  if (!text) return false;
  if (/\b(401|403|400|404|409|422)\b|invalid|unauthorized|forbidden|权限|参数|格式|not configured|不完整/i.test(text)) {
    return false;
  }
  return /\b(500|502|503|504|520|522|524)\b|timeout|timed out|failed to fetch|network|edgeone|gateway|temporar|abort|connection|socket|reset/i.test(text);
}

function platformDirectUrl(path) {
  return directPhpApiUrl(path);
}

function normalizeDirectApiBase(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function shouldFallbackToDirect(response, transportMode = config.transportMode) {
  if (transportMode !== "proxy") return false;
  if (requiresServerProxyEndpoint(config.textEndpoint || config.editEndpoint)) return false;
  const contentType = response.headers.get("content-type") || "";
  return response.status === 504 && /text\/html|text\/plain/i.test(contentType);
}

async function parseApiResponse(response, requestLog = null, imageBaseUrl = "") {
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
  const responseText = stripJsonBom(text);
  let payload = responseText;
  let parsedJson = false;
  try {
    payload = JSON.parse(responseText);
    parsedJson = true;
  } catch {
    if (!response.ok) {
      const message = formatHttpError(response.status, responseText);
      completeRequestLog(requestLog, {
        status: "failed",
        httpStatus: response.status,
        ok: response.ok,
        contentType,
        imageCount: 0,
        responsePreview: message,
        error: message,
      });
      throw new Error(message);
    }
  }
  const imageCount = normalizeImages(payload, imageBaseUrl || response.url || "").length;
  if (!response.ok) {
    const responseCode = String(payload?.error?.code || payload?.code || "").trim();
    const message = payload?.error?.message || payload?.message || responseText || `请求失败：${response.status}`;
    const formatted = appendErrorCode(formatHttpError(response.status, message), responseCode);
    completeRequestLog(requestLog, {
      status: "failed",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount,
      responsePreview: summarizeLogValue(parsedJson ? payload : text),
      error: formatted,
    });
    throw imageRequestError(formatted, responseCode);
  }
  const embeddedError = payload?.error || payload?.message;
  if (embeddedError && !imageCount) {
    const responseCode = String(payload?.error?.code || payload?.code || "").trim();
    const formatted = appendErrorCode(formatHttpError(response.status, embeddedError), responseCode);
    completeRequestLog(requestLog, {
      status: "failed",
      httpStatus: response.status,
      ok: response.ok,
      contentType,
      imageCount,
      responsePreview: summarizeLogValue(parsedJson ? payload : text),
      error: formatted,
    });
    throw imageRequestError(formatted, responseCode);
  }
  completeRequestLog(requestLog, {
    status: imageCount ? "success" : "no-image",
    httpStatus: response.status,
    ok: response.ok,
    contentType,
    imageCount,
    responsePreview: summarizeLogValue(parsedJson ? payload : text),
  });
  if (response.platformTicket && payload && typeof payload === "object") {
    payload.platformTicket = response.platformTicket;
    payload.platformPriceCents = response.platformPriceCents;
  }
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

function imageRequestError(message, code = "") {
  const error = new Error(message);
  if (code) error.code = code;
  return error;
}

function appendErrorCode(message, code = "") {
  const cleanCode = String(code || "").trim();
  if (!cleanCode || String(message || "").includes(cleanCode)) return String(message || "");
  return `${message} (${cleanCode})`;
}

function cleanErrorMessage(error) {
  return appendErrorCode(formatHttpError(0, error?.message || String(error)), error?.code);
}

function isBalanceError(text = "") {
  return /余额不足|剩余额度|可用余额|预扣费额度失败|预扣费失败|预扣费不足|insufficient balance|not enough balance|available balance|wallet balance|balance too low|pre[- ]?charge|predebit|debit failed/i.test(
    String(text || ""),
  );
}

function addApiGuidance(message, extra = "") {
  const base = String(message || "").replace(/\s+/g, " ").trim();
  if (!base) return "";
  const intro = /[。！？.!?]$/.test(base) ? base : `${base}。`;
  const parts = [];
  if (extra) parts.push(String(extra).replace(/\s+/g, " ").trim());
  parts.push("常见原因是上游 API 未正确配置，或地址/Key/模型/通道参数填错，也可能是供应商接口临时异常。");
  parts.push("请先按供应商文档重新检查并保存配置。");
  if (isPlatformApiSelected()) {
    parts.push("如果当前已经在用站点API，请重点核对站点 API 的地址、Key、模型/通道参数是否与文档一致。");
  } else {
    parts.push("如果当前用的是自定义 API，仍失败时可以临时切到“站点API”对比排查。");
  }
  return `${intro}${parts.join(" ")}`.trim();
}

function formatHttpError(status, message) {
  const rawText = typeof message === "object" ? JSON.stringify(message) : String(message || "");
  const text = rawText.replace(/\s+/g, " ").trim();
  const code = text.match(/Error code\s*(\d{3})/i)?.[1] || (status ? String(status) : "");
  const title = text.match(/<title>(.*?)<\/title>/i)?.[1];
  if (isBalanceError(text)) {
    return text.slice(0, 260) || `请求失败${code ? `：${code}` : ""}`;
  }
  if (/openai_error|bad_response_status_code/i.test(text)) {
    return addApiGuidance(
      "API 返回 openai_error，响应里没有图片数据。网页无法取回已在上游生成但未返回的图片，已停止自动补单以避免重复扣费。",
      "这通常说明供应商返回格式和当前接口解析不一致。",
    );
  }
  if (code === "524" || /524: A timeout occurred|A timeout occurred/i.test(text)) {
    return addApiGuidance(
      "站点 API 请求超时（HTTP 524）。本次未扣费；请稍后重试或减少生成数量。",
      "这一般是服务器或上游通道响应过慢。",
    );
  }
  if (code === "504" && /EdgeOne Pages/i.test(text)) {
    return addApiGuidance(
      "EdgeOne 代理超时（HTTP 504），这不是 base64 图片。已改为优先使用站点 API 直连；本次未扣费，请重试。",
      "如果手机端仍出现，请检查 api2img.shop 是否能直接访问。",
    );
  }
  if (/failed to fetch|fetch failed|network error|network|connection|timeout|timed out|request aborted|aborted|econnreset|enotfound|socket hang up|dns|certificate/i.test(text)) {
    return addApiGuidance(
      `请求失败${code ? `（${code}）` : ""}，可能是 Failed to fetch 或网络连接异常。`,
      "请重点检查 API 地址、Key、跨域/代理配置和供应商状态。",
    );
  }
  if (code === "405" || /MethodNotAllowed|method not allowed/i.test(text)) {
    return addApiGuidance(
      "API 返回 MethodNotAllowed（HTTP 405），请求没有进入正确的图像接口。",
      "常见原因是接口地址不是 /v1/images/generations 或 /v1/images/edits，图生图字段名不匹配，或浏览器直连触发了供应商不支持的跨域预检；系统会优先尝试服务器代理。",
    );
  }
  if (/\b(401|403)\b|unauthorized|invalid api key|forbidden|permission denied/i.test(text)) {
    return addApiGuidance(
      `鉴权失败${code ? `（${code}）` : ""}，API Key、签名或权限可能不正确。`,
      "请重新核对接口文档里的鉴权方式和参数名称。",
    );
  }
  if (/\b429\b|rate limit|quota|billing/i.test(text)) {
    return addApiGuidance(
      `请求被限制${code ? `（${code}）` : ""}，可能是频率过高、额度不足或余额已耗尽。`,
      "请稍后重试，或检查供应商账户额度和通道限制。",
    );
  }
  if (/\b(500|502|503|520|522)\b|bad gateway|gateway timeout|service unavailable|internal server error|server error|stream error|received from peer|rst_stream|reset/i.test(text)) {
    return addApiGuidance(
      `上游服务异常${code ? `（${code}）` : ""}，接口返回内容不完整或连接被中断。`,
      "这类问题通常不是前端本身造成的，请优先检查供应商接口。",
    );
  }
  if (/<!doctype html|<html[\s>]/i.test(text)) {
    return addApiGuidance(
      title ? `接口返回 HTML：${title}` : "接口返回 HTML 页面，请检查 API URL 是否为真实接口路径。",
      "通常是地址填错、跳转到了网页页，或供应商返回了错误页。",
    );
  }
  return addApiGuidance(text.slice(0, 260) || `请求失败${code ? `：${code}` : ""}`);
}

function tagPayloadImageBaseUrl(payload, baseUrl = "") {
  if (payload && typeof payload === "object") {
    Object.defineProperty(payload, "__imageBaseUrl", {
      value: baseUrl,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }
  return payload;
}

function normalizeImages(payload, baseUrl = "") {
  const images = [];
  const resolvedBaseUrl = (payload && typeof payload === "object" ? payload.__imageBaseUrl || "" : "") || baseUrl;
  collectImages(payload, images, new Set(), 0, "", resolvedBaseUrl);
  return images;
}

function collectImages(value, images, seen, depth, keyPath, baseUrl = "") {
  if (value == null || depth > 8) return;

  if (typeof value === "string") {
    const parsed = tryParseJsonValue(value);
    if (parsed != null && typeof parsed !== "string") {
      collectImages(parsed, images, seen, depth + 1, keyPath, baseUrl);
      return;
    }

    for (const source of normalizeImageSources(value, keyPath, baseUrl)) {
      if (source && !seen.has(source)) {
        seen.add(source);
        images.push(source);
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImages(item, images, seen, depth + 1, `${keyPath}[${index}]`, baseUrl));
    return;
  }

  if (typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === "__imageBaseUrl") continue;
    collectImages(nested, images, seen, depth + 1, keyPath ? `${keyPath}.${key}` : key, baseUrl);
  }
}

function normalizeImageSource(source, keyPath = "") {
  return normalizeImageSources(source, keyPath)[0] || "";
}

function normalizeImageSources(source, keyPath = "", baseUrl = "") {
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

  if (imageField) {
    const absoluteValueUrl = resolveImageUrl(value, baseUrl);
    if (absoluteValueUrl && isLikelyImageUrl(absoluteValueUrl)) addSource(absoluteValueUrl);
  }

  const relativeUrls = value.match(/(?:^|[\s"'(])((?:\/|\.\/|\.\.\/)[^\s"'<>),]+(?:\.(?:png|jpe?g|webp|gif|bmp|avif)(?:[?#][^\s"'<>),]*)?))/gi) || [];
  relativeUrls.forEach((match) => {
    const relative = match.replace(/^[\s"'(]+/, "");
    const absolute = resolveImageUrl(relative, baseUrl);
    if (absolute && (isLikelyImageUrl(absolute) || imageField)) addSource(absolute);
  });

  const imageBase64 = value.match(/[A-Za-z0-9+/_-]{220,}={0,2}/)?.[0];
  if (imageBase64 && (imageField || looksLikeImageBase64(imageBase64)) && !dataUrls.length) {
    const imageBase64Items = value.match(/[A-Za-z0-9+/_-]{220,}={0,2}/g) || [];
    imageBase64Items.forEach((item) => {
      addSource(`data:${imageMimeFromBase64(item)};base64,${item.replace(/-/g, "+").replace(/_/g, "/")}`);
    });
  }
  return sources;
}

function resolveImageUrl(value, baseUrl = "") {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.startsWith("data:image/")) return text;
  if (!baseUrl || !/^(?:\/|\.\/|\.\.\/)/.test(text)) return "";
  try {
    return new URL(text, baseUrl).toString();
  } catch {
    return "";
  }
}

function looksLikeImageBase64(value) {
  const clean = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  return /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/.test(clean);
}

function imageMimeFromBase64(value) {
  const clean = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  if (clean.startsWith("/9j/")) return "image/jpeg";
  if (clean.startsWith("R0lGOD")) return "image/gif";
  if (clean.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

function cleanImageSource(source) {
  const value = String(source || "").trim();
  if (value.startsWith("data:image/")) return value.replace(/\s/g, "");
  return value.replace(/[.。]+$/, "");
}

function isLikelyImageUrl(url) {
  const clean = url.replace(/[.。]$/, "");
  if (isExcludedImageUrl(clean)) return false;
  if (/\/v\d+\/images\/(?:generations|edits)\b/i.test(clean)) return false;
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
  const dimensions = dimensionsFromOptions(options);
  return {
    id: makeId(),
    src,
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

async function finalizeResultAsset(resultId, source, options = {}) {
  try {
    const savedSrc = await persistableImageSource(source, RESULT_CACHE_TIMEOUT_MS);
    const dimensions = await getImageDimensionsSafe(savedSrc || source, IMAGE_DIMENSION_TIMEOUT_MS);
    const result = state.results.find((item) => item.id === resultId);
    if (!result) return;
    let changed = false;
    if (savedSrc && savedSrc !== result.src) {
      result.src = savedSrc;
      changed = true;
    }
    if (dimensions.width > 1 || dimensions.height > 1) {
      if (result.width !== dimensions.width || result.height !== dimensions.height) {
        result.width = dimensions.width;
        result.height = dimensions.height;
        changed = true;
      }
    } else if (!result.width || !result.height) {
      const fallback = dimensionsFromOptions(options);
      result.width = fallback.width;
      result.height = fallback.height;
      changed = true;
    }
    if (!changed) return;
    renderResults();
    await persistState();
  } catch (error) {
    console.warn("图片后台缓存失败", error);
  }
}

function dimensionsFromOptions(options = {}) {
  const selected = String(effectiveRequestSize(options) || "").trim();
  const match = selected.match(/^(\d{2,5})x(\d{2,5})$/i);
  if (match) {
    return {
      width: Math.max(1, Number(match[1]) || 1),
      height: Math.max(1, Number(match[2]) || 1),
    };
  }
  if (options.ratio && /^\d+:\d+$/.test(String(options.ratio))) {
    const [width, height] = String(options.ratio).split(":").map((value) => Math.max(1, Number(value) || 1));
    return { width, height };
  }
  return { width: 1, height: 1 };
}

function renderResults() {
  const grid = $("#resultGrid");
  $("#resultMeta").textContent = state.results.length ? `${state.results.length} 张图片` : "生成后的图片会排列在这里";

  if (!state.results.length) {
    grid.className = "result-grid empty";
    grid.innerHTML = `<div class="empty-state"><h3>还没有图片</h3><p>在底部输入提示词，上传参考图，选择模型和质量，然后生成。</p></div>`;
    disconnectResultMasonryObserver();
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
    const refreshCardLayout = () => {
      syncResultCardImageSize(card, image);
      scheduleResultMasonryLayout();
    };
    image.addEventListener("load", refreshCardLayout, { once: true });
    image.addEventListener("error", scheduleResultMasonryLayout, { once: true });
    if (image.complete) requestAnimationFrame(refreshCardLayout);
    image.addEventListener("click", () => openDetail(item.id));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openDetail(item.id));
    card.querySelector('[data-action="reuse"]').addEventListener("click", () => reusePrompt(item.prompt));
    card.querySelector('[data-action="download"]').addEventListener("click", () => downloadImage(item.src, fileNameFor(item)));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteResult(item.id));
    grid.appendChild(card);
  });
  renderIcons();
  watchResultMasonry(grid);
  layoutResultMasonry();
  scheduleResultMasonryLayout();
}

function syncResultCardImageSize(card, image) {
  const width = Number(image?.naturalWidth || 0);
  const height = Number(image?.naturalHeight || 0);
  if (!card || !width || !height) return;

  card.dataset.width = String(width);
  card.dataset.height = String(height);
  card.style.setProperty("--ratio", `${width} / ${height}`);
}

function disconnectResultMasonryObserver() {
  if (!resultMasonryObserver) return;
  resultMasonryObserver.disconnect();
  resultMasonryObservedWidth = 0;
}

function watchResultMasonry(grid) {
  if (!grid || !("ResizeObserver" in window)) return;

  if (!resultMasonryObserver) {
    resultMasonryObserver = new ResizeObserver((entries) => {
      let shouldLayout = false;
      entries.forEach((entry) => {
        if (entry.target?.id === "resultGrid") {
          const width = Number(entry.contentRect?.width || 0);
          if (Math.abs(width - resultMasonryObservedWidth) > 1) {
            resultMasonryObservedWidth = width;
            shouldLayout = true;
          }
          return;
        }
        shouldLayout = true;
      });
      if (shouldLayout) scheduleResultMasonryLayout();
    });
  }

  resultMasonryObserver.disconnect();
  resultMasonryObservedWidth = grid.getBoundingClientRect().width || 0;
  resultMasonryObserver.observe(grid);
  grid.querySelectorAll(".image-card img").forEach((image) => resultMasonryObserver.observe(image));
}

function scheduleResultMasonryLayout() {
  if (resultMasonryFrame) cancelAnimationFrame(resultMasonryFrame);
  resultMasonryFrame = requestAnimationFrame(() => {
    resultMasonryFrame = requestAnimationFrame(() => {
      resultMasonryFrame = 0;
      layoutResultMasonry();
    });
  });
}

function layoutResultMasonry() {
  const grid = $("#resultGrid");
  if (!grid || grid.classList.contains("empty")) return;
  const cards = [...grid.querySelectorAll(".image-card")];

  if (window.matchMedia("(max-width: 900px)").matches) {
    cards.forEach((card) => card.style.removeProperty("grid-row-end"));
    return;
  }

  cards.forEach((card) => card.style.removeProperty("grid-row-end"));

  const styles = getComputedStyle(grid);
  const rowHeight = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 8;
  const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0;
  const rowSize = rowHeight + rowGap;
  cards.forEach((card) => {
    const image = card.querySelector("img");
    syncResultCardImageSize(card, image);

    const cardHeight = card.getBoundingClientRect().height;
    if (!cardHeight || !rowSize) return;
    const rowSpan = Math.max(1, Math.ceil((cardHeight + rowGap) / rowSize));
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
  if ($("#detailModal").hidden || (event.pointerType === "mouse" && event.button !== 0)) return;
  const viewport = $("#detailViewport");
  event.preventDefault();
  viewport.setPointerCapture?.(event.pointerId);
  detailView.pointers.set(event.pointerId, detailPointerFromEvent(event));

  if (detailView.pointers.size >= 2) {
    beginDetailPinch();
    return;
  }

  if (detailView.scale > 1.01) {
    beginDetailDrag(event);
  }
}

function onDetailPointerMove(event) {
  if (!detailView.pointers.has(event.pointerId)) return;
  detailView.pointers.set(event.pointerId, detailPointerFromEvent(event));

  if (detailView.pointers.size >= 2) {
    event.preventDefault();
    updateDetailPinch();
    return;
  }

  if (!detailView.dragging) return;
  event.preventDefault();
  detailView.x = detailView.startPanX + event.clientX - detailView.startX;
  detailView.y = detailView.startPanY + event.clientY - detailView.startY;
  clampDetailPan();
  applyDetailTransform();
}

function onDetailPointerUp(event) {
  if (!detailView.pointers.has(event.pointerId)) return;
  const viewport = $("#detailViewport");
  detailView.pointers.delete(event.pointerId);
  try {
    viewport.releasePointerCapture?.(event.pointerId);
  } catch {
    // The pointer may already be released by the browser.
  }

  if (detailView.pointers.size >= 2) {
    beginDetailPinch();
    return;
  }

  detailView.pinching = false;
  viewport.classList.remove("is-pinching");

  if (detailView.pointers.size === 1 && detailView.scale > 1.01) {
    const pointer = [...detailView.pointers.values()][0];
    beginDetailDrag(pointer);
    return;
  }

  detailView.dragging = false;
  viewport.classList.remove("is-dragging");
}

function beginDetailDrag(pointer) {
  detailView.dragging = true;
  detailView.startX = pointer.clientX;
  detailView.startY = pointer.clientY;
  detailView.startPanX = detailView.x;
  detailView.startPanY = detailView.y;
  $("#detailViewport").classList.add("is-dragging");
}

function beginDetailPinch() {
  const [first, second] = detailPointerPair();
  if (!first || !second) return;
  const center = detailPointerCenter(first, second);
  detailView.dragging = false;
  detailView.pinching = true;
  detailView.pinchStartDistance = Math.max(1, detailPointerDistance(first, second));
  detailView.pinchStartScale = detailView.scale;
  detailView.pinchStartX = detailView.x;
  detailView.pinchStartY = detailView.y;
  detailView.pinchStartCenterX = center.x;
  detailView.pinchStartCenterY = center.y;
  $("#detailViewport").classList.remove("is-dragging");
  $("#detailViewport").classList.add("is-pinching");
}

function updateDetailPinch() {
  const [first, second] = detailPointerPair();
  if (!first || !second) return;
  if (!detailView.pinching) beginDetailPinch();
  const center = detailPointerCenter(first, second);
  const distance = Math.max(1, detailPointerDistance(first, second));
  const nextScale = clamp((detailView.pinchStartScale * distance) / detailView.pinchStartDistance, 1, 8);
  const scaleRatio = nextScale / Math.max(detailView.pinchStartScale, 0.001);

  detailView.scale = nextScale;
  detailView.x = center.x - (detailView.pinchStartCenterX - detailView.pinchStartX) * scaleRatio;
  detailView.y = center.y - (detailView.pinchStartCenterY - detailView.pinchStartY) * scaleRatio;
  clampDetailPan();
  applyDetailTransform();
}

function detailPointerFromEvent(event) {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
  };
}

function detailPointerPair() {
  return [...detailView.pointers.values()].slice(0, 2);
}

function detailPointerDistance(first, second) {
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function detailPointerCenter(first, second) {
  const viewport = $("#detailViewport");
  const rect = viewport.getBoundingClientRect();
  return {
    x: (first.clientX + second.clientX) / 2 - rect.left - rect.width / 2,
    y: (first.clientY + second.clientY) / 2 - rect.top - rect.height / 2,
  };
}

function onGlobalKeyDown(event) {
  if (event.key === "Escape" && !$("#detailModal").hidden) closeDetail();
  if (isTextEntryField(document.activeElement)) return;
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  const key = event.key.toLowerCase();
  statsOpenBuffer = `${statsOpenBuffer}${key}`.slice(-API_STATS_OPEN_PHRASE.length);
  codeAdminOpenBuffer = `${codeAdminOpenBuffer}${key}`.slice(-CODE_ADMIN_OPEN_PHRASE.length);
  const action = resolveHiddenPhraseAction();
  if (action) {
    event.preventDefault();
    runHiddenPhraseAction(action);
  }
}

function onHiddenPhraseInput(event) {
  const field = event?.target || document.activeElement;
  if (!isTextEntryField(field)) return;
  const value = String(field.value || "").toLowerCase();
  let action = null;
  if (value.endsWith(CODE_ADMIN_OPEN_PHRASE)) action = { phrase: CODE_ADMIN_OPEN_PHRASE, open: () => openCodeAdminPanel() };
  else if (value.endsWith(API_STATS_OPEN_PHRASE)) action = { phrase: API_STATS_OPEN_PHRASE, open: () => openStatsPanelWithPassword() };
  if (!action) return;
  removeOpenPhraseFromField(field, action.phrase);
  resetHiddenPhraseBuffers();
  action.open();
}

function resolveHiddenPhraseAction() {
  if (statsOpenBuffer === API_STATS_OPEN_PHRASE) {
    return { phrase: API_STATS_OPEN_PHRASE, open: () => openStatsPanelWithPassword() };
  }
  if (codeAdminOpenBuffer === CODE_ADMIN_OPEN_PHRASE) {
    return { phrase: CODE_ADMIN_OPEN_PHRASE, open: () => openCodeAdminPanel() };
  }
  return null;
}

function runHiddenPhraseAction(action) {
  resetHiddenPhraseBuffers();
  removeOpenPhraseFromActiveField(action.phrase);
  action.open();
}

function resetHiddenPhraseBuffers() {
  statsOpenBuffer = "";
  codeAdminOpenBuffer = "";
}

function removeOpenPhraseFromActiveField(phrase) {
  const field = document.activeElement;
  removeOpenPhraseFromField(field, phrase);
}

function removeOpenPhraseFromField(field, phrase) {
  if (!isTextEntryField(field)) return;
  const value = field.value || "";
  if (!value.toLowerCase().endsWith(phrase)) return;
  field.value = value.slice(0, -phrase.length);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function isTextEntryField(field) {
  if (!field || !["INPUT", "TEXTAREA"].includes(field.tagName || "")) return false;
  const type = String(field.type || "text").toLowerCase();
  return !["button", "checkbox", "file", "hidden", "radio", "range", "submit"].includes(type);
}

async function openStatsPanelWithPassword() {
  openCodeAdminPanel("stats");
}

function resetDetailView() {
  detailView.scale = 1;
  detailView.x = 0;
  detailView.y = 0;
  detailView.dragging = false;
  detailView.pinching = false;
  detailView.pointers.clear();
  $("#detailViewport")?.classList.remove("is-dragging", "is-pinching");
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
  const select = $("#sizeSelect");
  const previousSize = select.value;
  select.innerHTML = preset.sizes.map((size) => optionHtml(size, size)).join("");
  select.value = preset.sizes.includes(previousSize) ? previousSize : preset.sizes[0];
}

function getModelName() {
  const input = $("#modelName");
  if (input) input.value = FIXED_MODEL_NAME;
  return FIXED_MODEL_NAME;
}

function loadConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    Object.assign(config, saved);
    if (!saved.rememberKey) config.apiKey = "";
    config.apiProvider = "platform";
    config.multiImageMode = "single";
    config.transportMode = normalizeCustomTransportMode(config.textEndpoint || "", config.editEndpoint || "", config.transportMode || "proxy");
    config.modelName = FIXED_MODEL_NAME;
  } catch {
    showToast("配置读取失败");
  }
}

function hydrateConfig() {
  if ($("#textEndpoint")) $("#textEndpoint").value = config.textEndpoint || "";
  if ($("#editEndpoint")) $("#editEndpoint").value = config.editEndpoint || "";
  if ($("#apiKey")) $("#apiKey").value = config.apiKey || "";
  if ($("#rememberKey")) $("#rememberKey").checked = Boolean(config.rememberKey);
  if ($("#requestFormat")) $("#requestFormat").value = config.requestFormat || "openai";
  if ($("#transportMode")) $("#transportMode").value = config.transportMode || "proxy";
  if ($("#multiImageMode")) $("#multiImageMode").value = "single";
  if ($("#apiProviderSelect")) $("#apiProviderSelect").value = config.apiProvider || "platform";
  if ($("#customTemplate")) $("#customTemplate").value = config.customTemplate || defaultTemplate;
  if ($("#modelName")) $("#modelName").value = FIXED_MODEL_NAME;
  config.modelName = FIXED_MODEL_NAME;
  updateTemplateVisibility();
  updateApiProviderUi();
}

function saveConfigFromForm() {
  config.textEndpoint = $("#textEndpoint")?.value.trim() || "";
  config.editEndpoint = $("#editEndpoint")?.value.trim() || "";
  normalizeConfiguredEditEndpoint();
  config.apiKey = $("#apiKey")?.value.trim() || "";
  config.rememberKey = Boolean($("#rememberKey")?.checked);
  config.requestFormat = $("#requestFormat")?.value || "openai";
  config.transportMode = $("#transportMode")?.value || "direct";
  config.multiImageMode = "single";
  config.apiProvider = isCustomApiDebugEnabled() ? "custom" : "platform";
  config.customTemplate = $("#customTemplate")?.value.trim() || defaultTemplate;
  config.modelName = FIXED_MODEL_NAME;
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
    if ($("#editEndpoint")) $("#editEndpoint").value = corrected;
    if ($("#adminCustomEditEndpoint")) $("#adminCustomEditEndpoint").value = corrected;
  }
}

function saveMultiImageMode() {
  config.multiImageMode = "single";
  saveActiveConfig();
}

function onApiProviderChange() {
  config.apiProvider = isCustomApiDebugEnabled() ? "custom" : "platform";
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
    multiImageMode: "single",
    apiProvider: "platform",
    customTemplate: config.customTemplate || defaultTemplate,
    modelName: FIXED_MODEL_NAME,
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

function siteApiDisplayName(index = 0) {
  const value = Math.max(1, Number(index) + 1);
  return `${SITE_API_DISPLAY_PREFIX}${value}`;
}

function isSiteApiDisplayName(value) {
  return new RegExp(`^${SITE_API_DISPLAY_PREFIX}\\d+$`).test(String(value || "").trim());
}

function normalizeApiDisplayName(value, index = 0) {
  const text = String(value || "").trim();
  return isSiteApiDisplayName(text) ? text : siteApiDisplayName(index);
}

function requiresServerProxyEndpoint(endpoint) {
  return false;
}

function normalizeCustomTransportMode(textEndpoint = "", editEndpoint = "", transportMode = "") {
  return transportMode === "direct" ? "direct" : "proxy";
}

function adminEndpointHistoryLabel(item = {}) {
  const textEndpoint = String(item.textEndpoint || "").trim();
  const editEndpoint = String(item.editEndpoint || "").trim();
  if (textEndpoint && editEndpoint) return `文生图：${textEndpoint} · 图生图：${editEndpoint}`;
  if (textEndpoint) return `文生图：${textEndpoint}`;
  if (editEndpoint) return `图生图：${editEndpoint}`;
  return "未设置 URL";
}

function configSnapshotTitle(snapshot, index = 0) {
  return normalizeApiDisplayName(snapshot?.title || snapshot?.displayName || "", index);
}

function currentApiDisplayName(endpoint = "", options = {}, index = 0) {
  if (options.apiDisplayName) return normalizeApiDisplayName(options.apiDisplayName, index);
  if (options.apiProvider === "platform" || isDirectPhpApiUrl(endpoint) || endpoint === "/api/generate/platform") {
    return normalizeApiDisplayName(billingState.platformDisplayName, index);
  }
  return normalizeApiDisplayName(customDebugState.current?.title || config.title || "", index);
}

function visibleLogApiName(entry = {}, index = 0) {
  return normalizeApiDisplayName(entry.apiDisplayName || entry.endpointDisplayName || entry.displayName || "", index);
}

function uniqueHistoryDisplayName(item = {}, index = 0, usedNames = new Set()) {
  let name = isSiteApiDisplayName(item.title || item.displayName) ? String(item.title || item.displayName).trim() : "";
  if (!name || usedNames.has(name)) {
    let offset = 0;
    do {
      name = siteApiDisplayName(index + offset);
      offset += 1;
    } while (usedNames.has(name));
  }
  usedNames.add(name);
  return name;
}

function renderConfigHistory() {
  const list = $("#configHistoryList");
  if (!list) return;

  if (!configHistory.length) {
    list.innerHTML = `<div class="config-history-empty">保存配置后会显示在这里</div>`;
    return;
  }

  const usedNames = new Set();
  list.innerHTML = configHistory
    .map((item, index) => {
      const displayName = uniqueHistoryDisplayName(item, index, usedNames);
      const keyLabel = item.apiKey ? maskApiKey(item.apiKey) : "未保存 Key";
      const transportLabel = item.transportMode === "direct" ? "直连" : "代理";
      const multiLabel = item.multiImageMode === "batch" ? "单次批量" : "逐张稳定";
      return `
        <div class="config-history-item" data-config-id="${escapeHtml(item.id)}">
          <button class="config-history-main" type="button" data-action="switch-config">
            <strong>${escapeHtml(displayName)}</strong>
            <span>${escapeHtml("站点 API 配置")}</span>
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
  config.modelName = FIXED_MODEL_NAME;
  ensureModelOption(config.modelName);
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
    const sessionSnapshot = currentWalletSessionToken();
    const requests = [loadBillingConfig()];
    if (sessionSnapshot) {
      requests.push(apiFetchPreferDirect("/api/auth/me", { timeoutMs: FAST_API_TIMEOUT_MS }, {
        directFirst: true,
        timeoutMs: FAST_API_TIMEOUT_MS,
        label: "登录状态读取",
      }));
    }
    const [configResult, meResponse] = await Promise.allSettled(requests);
    if (configResult.status === "rejected") console.warn("充值配置读取失败", configResult.reason);
    if (walletSessionChanged(sessionSnapshot)) return;
    if (meResponse?.status === "fulfilled" && meResponse.value.ok) applyBillingDashboard(await readJsonResponse(meResponse.value));
    renderWallet();
    if (billingState.authenticated) {
      billingState.ledgerLoading = true;
      renderWallet();
      loadBillingLedger({ silent: true, sessionSnapshot })
        .then(() => {
          if (!walletSessionChanged(sessionSnapshot)) renderWallet();
        })
        .catch((error) => console.warn("流水读取失败", error));
    }
  } catch (error) {
    console.warn("充值信息读取失败", error);
  }
}

async function loadBillingConfig() {
  const configResponse = await apiFetchPreferDirect("/api/billing/config", {
    timeoutMs: FAST_API_TIMEOUT_MS,
  }, {
    directFirst: true,
    timeoutMs: FAST_API_TIMEOUT_MS,
    label: "充值配置读取",
  });
  const info = await readJsonResponse(configResponse);
  billingState.configLoaded = true;
  if (!configResponse.ok) return false;
  billingState.priceCents = Number(info.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
  billingState.upstreamCostCents = Number(info.upstreamCostCents || billingState.upstreamCostCents || 0);
  billingState.platformEnabled = Boolean(info.platformEnabled);
  billingState.rechargeUrl = info.rechargeUrl || billingState.rechargeUrl;
  billingState.directBaseUrl = normalizeDirectApiBase(info.directBaseUrl || billingState.directBaseUrl);
  billingState.platformRequestFormat = info.requestFormat === "json" ? "json" : "openai";
  billingState.platformTransportMode = info.transportMode === "direct" ? "direct" : "proxy";
  billingState.platformCustomTemplate = info.customTemplate || "";
  billingState.platformModelName = info.modelName || "";
  billingState.platformDisplayName = normalizeApiDisplayName(info.displayName || billingState.platformDisplayName);
  warmDirectApiBase();
  return billingState.platformEnabled;
}

function warmDirectApiBase() {
  if (directApiWarmupPromise) return directApiWarmupPromise;
  directApiWarmupPromise = fetchWithTimeout(directPhpApiUrl("/api/health"), {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
  }, 5000)
    .catch((error) => console.warn("PHP 接口预热失败", error))
    .finally(() => {
      setTimeout(() => {
        directApiWarmupPromise = null;
      }, 60000);
    });
  return directApiWarmupPromise;
}

async function refreshBilling() {
  try {
    const sessionSnapshot = currentWalletSessionToken();
    const response = await apiFetchPreferDirect("/api/auth/me", { timeoutMs: FAST_API_TIMEOUT_MS }, {
      directFirst: true,
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "余额刷新",
    });
    if (walletSessionChanged(sessionSnapshot)) return;
    if (!response.ok) return;
    applyBillingDashboard(await readJsonResponse(response));
    renderWallet();
    if (billingState.authenticated) {
      billingState.ledgerLoading = true;
      renderWallet();
      loadBillingLedger({ silent: true, sessionSnapshot })
        .then(() => {
          if (!walletSessionChanged(sessionSnapshot)) renderWallet();
        })
        .catch((error) => console.warn("流水读取失败", error));
    }
  } catch (error) {
    console.warn("余额刷新失败", error);
  }
}

async function loadBillingLedger(options = {}) {
  const sessionSnapshot = options.sessionSnapshot ?? currentWalletSessionToken();
  try {
    const response = await apiFetchPreferDirect("/api/billing/ledger", {
      timeoutMs: FAST_API_TIMEOUT_MS,
    }, {
      directFirst: Boolean(currentWalletSessionToken()),
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "流水读取",
    });
    if (walletSessionChanged(sessionSnapshot)) return;
    const payload = await readJsonResponse(response);
    if (walletSessionChanged(sessionSnapshot)) return;
    if (!response.ok) throw new Error(payload?.error?.message || "流水读取失败");
    billingState.ledger = Array.isArray(payload.ledger) ? payload.ledger : [];
    billingState.ledgerLoading = false;
  } catch (error) {
    if (walletSessionChanged(sessionSnapshot)) return;
    billingState.ledger = [];
    billingState.ledgerLoading = false;
    if (!options.silent) console.warn("流水读取失败", error);
  }
}

async function trackSiteVisit() {
  try {
    if (siteVisitTracked) return false;
    try {
      if (sessionStorage.getItem(SITE_VISIT_TRACK_KEY) === "1") {
        siteVisitTracked = true;
        return false;
      }
    } catch {}

    const response = await fetch("/api/site/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "visit" }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "杩囩▼涓婃姤澶辫触");
    siteVisitTracked = true;
    try {
      sessionStorage.setItem(SITE_VISIT_TRACK_KEY, "1");
    } catch {}
    applySiteStats(payload.siteStats || payload);
    return true;
  } catch (error) {
    console.warn("站点访问上报失败", error);
    return false;
  }
}

async function loadSiteStats(options = {}) {
  try {
    const response = await fetch("/api/site/stats");
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "缁熻璇诲彇澶辫触");
    applySiteStats(payload.siteStats || payload);
    renderSiteStats();
    return payload.siteStats || payload;
  } catch (error) {
    if (!options.silent) showToast(error.message || "缁熻璇诲彇澶辫触");
    console.warn("站点统计读取失败", error);
    return null;
  }
}

function applySiteStats(payload = {}) {
  siteStatsState.onlineCount = Math.max(0, Number(payload.onlineCount || 0));
  siteStatsState.totalVisits = Math.max(0, Number(payload.totalVisits || 0));
  siteStatsState.todayVisits = Math.max(0, Number(payload.todayVisits || 0));
  siteStatsState.totalVisitors = Math.max(0, Number(payload.totalVisitors || 0));
  siteStatsState.lastVisitAt = Math.max(0, Number(payload.lastVisitAt || 0));
  siteStatsState.updatedAt = Math.max(0, Number(payload.updatedAt || 0));
  siteStatsState.onlineWindowMs = Math.max(0, Number(payload.onlineWindowMs || siteStatsState.onlineWindowMs || 0));
}

function renderSiteStats() {
  updateStatsPanelCopy();
  const summary = $("#siteStatsSummary");
  if (!summary) return;
  summary.innerHTML = `
    <div><strong>${formatCount(siteStatsState.onlineCount)}</strong><span>当前在线</span></div>
    <div><strong>${formatCount(siteStatsState.totalVisits)}</strong><span>累计访问</span></div>
    <div><strong>${formatCount(siteStatsState.todayVisits)}</strong><span>今日访问</span></div>
    <div><strong>${formatCount(siteStatsState.totalVisitors)}</strong><span>累计访客</span></div>
  `;
}

function updateStatsPanelCopy() {
  const title = $("#statsAdminSection .config-history-head h3");
  const desc = $("#statsAdminSection .config-history-head span");
  const clearLabel = $("#clearStatsButton span");
  if (title) title.textContent = "实时统计";
  if (desc) desc.textContent = "在线人数按最近 3 分钟心跳统计";
  if (clearLabel) clearLabel.textContent = "清空 API 统计";
}

function startSiteStatsPolling() {
  stopSiteStatsPolling();
  siteStatsRefreshTimer = setInterval(() => {
    if (!$("#codeAdminPanel")?.classList.contains("open")) return;
    loadSiteStats({ silent: true });
  }, SITE_HEARTBEAT_INTERVAL_MS);
}

function stopSiteStatsPolling() {
  if (siteStatsRefreshTimer) clearInterval(siteStatsRefreshTimer);
  siteStatsRefreshTimer = null;
}

function startSiteHeartbeat() {
  stopSiteHeartbeat();
  sendSiteHeartbeat();
  siteHeartbeatTimer = setInterval(() => {
    sendSiteHeartbeat();
  }, SITE_HEARTBEAT_INTERVAL_MS);
}

function stopSiteHeartbeat() {
  if (siteHeartbeatTimer) clearInterval(siteHeartbeatTimer);
  siteHeartbeatTimer = null;
}

async function sendSiteHeartbeat() {
  if (siteHeartbeatInFlight) return;
  siteHeartbeatInFlight = true;
  try {
    const response = await fetch("/api/site/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "heartbeat" }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) return;
    applySiteStats(payload.siteStats || payload);
    renderSiteStats();
  } catch (error) {
    console.warn("站点心跳失败", error);
  } finally {
    siteHeartbeatInFlight = false;
  }
}

function applyBillingDashboard(payload) {
  const user = payload.user || payload.customer || null;
  billingState.authenticated = Boolean(payload.authenticated || user);
  billingState.customerId = user?.id ? String(user.id) : "";
  billingState.email = user?.email || "";
  billingState.balanceCents = Number(user?.balanceCents || 0);
  if (payload.sessionToken) persistWalletSessionToken(payload.sessionToken);
  if (!billingState.sessionToken) billingState.sessionToken = readWalletSessionToken();
  if (!billingState.authenticated) billingState.ledger = [];
  if (!billingState.authenticated) billingState.ledgerLoading = false;
  billingState.priceCents = Number(payload.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
  billingState.upstreamCostCents = Number(payload.upstreamCostCents || billingState.upstreamCostCents || 0);
  billingState.rechargeUrl = payload.rechargeUrl || billingState.rechargeUrl;
  billingState.platformDisplayName = normalizeApiDisplayName(payload.displayName || billingState.platformDisplayName);
  billingState.lastDirectConfig = {
    ...(billingState.lastDirectConfig || {}),
    priceCents: billingState.priceCents,
    displayName: billingState.platformDisplayName,
  };
}

function renderWallet() {
  $("#walletBalance").textContent = billingState.authenticated ? `余额 ${formatMoney(billingState.balanceCents)} 元` : "登录钱包";
  $("#walletPanelBalance").textContent = billingState.authenticated ? `${formatMoney(billingState.balanceCents)} 元` : "--";
  $("#walletPrice").textContent = formatPlatformPriceLabel(billingState.priceCents);
  updateRecommendedApiLabels();
  $("#walletCustomerId").textContent = billingState.authenticated ? billingState.email || `用户 ${billingState.customerId}` : "未登录";
  $("#walletAuthBox").hidden = billingState.authenticated;
  $("#walletAccountBox").hidden = !billingState.authenticated;
  const rechargeLink = $(".wallet-recharge-link");
  if (rechargeLink) rechargeLink.href = billingState.rechargeUrl || "https://api2img.shop/";
  renderLedgerList();
}

function renderLedgerList() {
  const list = $("#ledgerList");
  if (!list) return;
  if (!billingState.authenticated) {
    list.innerHTML = `<div class="log-empty">登录后显示余额流水。</div>`;
    return;
  }
  if (billingState.ledgerLoading) {
    list.innerHTML = `<div class="log-empty">正在同步余额流水...</div>`;
    return;
  }
  if (!billingState.ledger.length) {
    list.innerHTML = `<div class="log-empty">还没有余额流水。</div>`;
    return;
  }
  list.innerHTML = billingState.ledger
    .map(
      (item) => {
        const amountCents = Number(item.amountCents || 0);
        const amountClass = amountCents < 0 ? "negative" : amountCents > 0 ? "positive" : "";
        const typeLabel = walletLedgerTypeLabel(item.type);
        const note = String(item.note || "").trim();
        const noteText = note ? `${typeLabel}：${note}` : typeLabel;
        return `
        <article class="wallet-item">
          <div class="wallet-item-top">
            <strong class="wallet-amount ${amountClass}">${formatSignedMoney(item.amountCents)} 元</strong>
            <span class="wallet-balance-after">余额 ${formatMoney(item.balanceAfterCents)} 元</span>
          </div>
          <p class="wallet-ledger-note" title="${escapeHtml(noteText)}">
            <span>${escapeHtml(typeLabel)}</span>${note ? `<em>${escapeHtml(note)}</em>` : ""}
          </p>
          <time class="wallet-ledger-time" datetime="${escapeHtml(String(item.createdAt || ""))}">${formatWalletTime(item.createdAt)}</time>
        </article>
      `;
      },
    )
    .join("");
}

async function sendLoginCode() {
  const email = normalizeContactEmail($("#loginEmailInput").value);
  if (!email) {
    showToast("请输入有效邮箱");
    $("#loginEmailInput").focus();
    return;
  }
  const button = $("#sendLoginCodeButton");
  button.disabled = true;
  button.innerHTML = `<i data-icon="rotate"></i><span>发送中...</span>`;
  renderIcons();
  try {
    const response = await apiFetchPreferDirect("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      timeoutMs: FAST_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "验证码发送",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "验证码发送失败");
    $("#loginEmailInput").value = email;
    startLoginCodeCooldown(LOGIN_CODE_RESEND_COOLDOWN_SECONDS);
    showToast("验证码已发送，请查看邮箱");
    $("#loginCodeInput").focus();
  } catch (error) {
    if (error?.message && /429|等待|频繁|cooldown|rate/i.test(error.message)) {
      startLoginCodeCooldown(LOGIN_CODE_RESEND_COOLDOWN_SECONDS);
    }
    showToast(error.message || "验证码发送失败");
  } finally {
    updateSendLoginCodeButton();
  }
}

async function verifyLoginCode() {
  const email = normalizeContactEmail($("#loginEmailInput").value);
  const code = $("#loginCodeInput").value.trim();
  if (!email) {
    showToast("请输入有效邮箱");
    $("#loginEmailInput").focus();
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    showToast("请输入 6 位验证码");
    $("#loginCodeInput").focus();
    return;
  }
  const button = $("#loginButton");
  button.disabled = true;
  button.innerHTML = `<i data-icon="check"></i><span>登录中...</span>`;
  renderIcons();
  try {
    const response = await apiFetchPreferDirect("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
      timeoutMs: FAST_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "登录验证",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "登录失败");
    applyBillingDashboard({ ...payload, authenticated: true });
    $("#loginCodeInput").value = "";
    renderWallet();
    showToast("登录成功，余额已同步");
    const sessionSnapshot = currentWalletSessionToken();
    billingState.ledgerLoading = true;
    renderWallet();
    loadBillingLedger({ silent: true, sessionSnapshot })
      .then(() => {
        if (!walletSessionChanged(sessionSnapshot)) renderWallet();
      })
      .catch((error) => console.warn("流水读取失败", error));
  } catch (error) {
    showToast(error.message || "登录失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>登录 / 注册</span>`;
    renderIcons();
  }
}

async function logoutWallet() {
  try {
    await apiFetchPreferDirect("/api/auth/logout", { method: "POST", timeoutMs: FAST_API_TIMEOUT_MS }, {
      directFirst: true,
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "退出登录",
    });
  } catch {}
  billingState.authenticated = false;
  billingState.customerId = "";
  billingState.email = "";
  billingState.balanceCents = 0;
  billingState.ledger = [];
  billingState.ledgerLoading = false;
  clearWalletSessionToken();
  renderWallet();
  showToast("已退出登录");
}

async function redeemCode() {
  const code = $("#redeemCodeInput").value.trim();
  if (!billingState.authenticated) {
    showToast("请先登录钱包再兑换充值码");
    $("#loginEmailInput").focus();
    return;
  }
  if (!code) {
    showToast("请输入充值码");
    $("#redeemCodeInput").focus();
    return;
  }
  try {
    const response = await apiFetchPreferDirect("/api/billing/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      timeoutMs: FAST_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: FAST_API_TIMEOUT_MS,
      label: "充值码兑换",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "兑换失败");
    $("#redeemCodeInput").value = "";
    await refreshBilling();
    showToast(`兑换成功，已到账 ${formatMoney(payload.redemption?.amountCents || 0)} 元`);
  } catch (error) {
    showToast(error.message || "兑换失败");
  }
}

function openCodeAdminPanel(section = "codes") {
  const savedPassword = localStorage.getItem(CODE_ADMIN_PASSWORD_KEY) || "";
  $("#codeAdminPassword").value = savedPassword;
  codeAdminState.authenticated = false;
  codeAdminState.pendingSection = section || "codes";
  syncCodeAdminLabel();
  applyCodeAdminAuthState();
  $("#codeAdminPanel").classList.add("open");
  $("#walletPanel").classList.remove("open");
  $("#settingsPanel").classList.remove("open");
  $("#logsPanel").classList.remove("open");
  setTimeout(() => $("#codeAdminPassword")?.focus(), 0);
}

function openCustomApiAdminSection() {
  codeAdminState.pendingSection = "custom";
  openCodeAdminPanel("custom");
  showToast("自定义 API 调试已移到站长后台，请先进入后台并启用调试开关");
}

function closeCodeAdminPanel() {
  $("#codeAdminPanel").classList.remove("open");
  codeAdminState.authenticated = false;
  codeAdminState.pendingSection = "codes";
  applyCodeAdminAuthState();
  stopSiteStatsPolling();
}

async function unlockCodeAdminPanel() {
  const password = $("#codeAdminPassword").value.trim();
  if (!password) {
    setCodeAdminAuthStatus("请输入管理密码");
    showToast("请输入管理密码");
    return;
  }

  const button = $("#unlockCodeAdminButton");
  button.disabled = true;
  button.textContent = "验证中...";
  setCodeAdminAuthStatus("正在验证管理员密码");
  try {
    const response = await apiFetchPreferDirect(`/api/admin/ping?t=${Date.now()}`, {
      headers: { "X-Admin-Password": password },
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "后台验证",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "管理员密码不正确");
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    codeAdminState.authenticated = true;
    applyCodeAdminAuthState();
    selectCodeAdminSection(codeAdminState.pendingSection || "codes");
    loadSiteStats({ silent: true });
    renderApiStats();
    startSiteStatsPolling();
    setCodeAdminAuthStatus("已进入站长后台");
    showToast("已进入站长后台");
  } catch (error) {
    codeAdminState.authenticated = false;
    applyCodeAdminAuthState();
    setCodeAdminAuthStatus(error.message || "管理员密码不正确");
    showToast(error.message || "管理员密码不正确");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>进入后台</span>`;
    renderIcons();
  }
}

function applyCodeAdminAuthState() {
  const login = $("#codeAdminLogin");
  const workspace = $("#codeAdminWorkspace");
  if (login) login.hidden = Boolean(codeAdminState.authenticated);
  if (workspace) workspace.hidden = !codeAdminState.authenticated;
  if (codeAdminState.authenticated) selectCodeAdminSection(codeAdminState.activeSection || codeAdminState.pendingSection || "codes");
}

function setCodeAdminAuthStatus(text) {
  const status = $("#codeAdminAuthStatus");
  if (status) status.textContent = text;
}

function selectCodeAdminSection(section) {
  const next = ["codes", "custom", "announcements", "stats"].includes(section) ? section : "codes";
  codeAdminState.activeSection = next;
  if (!codeAdminState.authenticated) {
    codeAdminState.pendingSection = next;
    return;
  }

  $$(".admin-nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === next);
  });
  $$(".admin-section-view").forEach((panel) => {
    const active = panel.dataset.adminPanel === next;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (next === "custom") loadCustomApiAdminConfig({ silent: true });
  if (next === "stats") {
    loadSiteStats({ silent: true });
    renderApiStats();
    startSiteStatsPolling();
  }
  if (next === "announcements") loadAnnouncements({ silent: true });
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
    const response = await apiFetchPreferDirect("/api/admin/redeem-codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ amountCents, count, label }),
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "兑换码生成",
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

function adminPassword() {
  return ($("#codeAdminPassword")?.value || localStorage.getItem(CODE_ADMIN_PASSWORD_KEY) || "").trim();
}

async function loadCustomApiAdminConfig(options = {}) {
  const password = adminPassword();
  if (!password) {
    setCustomApiAdminStatus("请先输入管理员密码");
    if (!options.silent) showToast("请先进入站长后台");
    return;
  }

  if (!options.silent) setCustomApiAdminStatus("正在读取当前全局配置...");
  try {
    const response = await apiFetchPreferDirect("/api/admin/custom-api", {
      headers: { "X-Admin-Password": password },
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "API 与定价读取",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || `读取失败：HTTP ${response.status}`);
    const serverConfig = payload.config || {};
    const globalConfig = payload.global || {};
    const formConfig = options.globalForm
      ? { ...(hasApiConfig(globalConfig) ? globalConfig : serverConfig), enabled: false }
      : hasApiConfig(serverConfig)
        ? serverConfig
        : { ...globalConfig, enabled: false };
    customDebugState.loaded = true;
    customDebugState.current = serverConfig;
    customDebugState.history = Array.isArray(payload.history) ? payload.history : [];
    customDebugState.global = globalConfig;
    applyGlobalApiInfo(globalConfig);
    applyCustomApiRuntimeConfig(serverConfig);
    hydrateAdminCustomApiForm(formConfig);
    renderAdminCustomHistory();
    setCustomApiAdminStatus(apiPricingStatus(serverConfig, globalConfig));
    if (!options.silent) showToast(options.globalForm ? "已读取当前全局 API 配置" : "已读取自定义 API 调试配置");
  } catch (error) {
    setCustomApiAdminStatus("读取失败");
    if (!options.silent) showToast(error.message || (options.globalForm ? "读取当前全局配置失败" : "读取自定义 API 调试配置失败"));
  }
}

async function saveCustomApiAdminConfig() {
  const password = adminPassword();
  if (!password) {
    showToast("请先输入管理员密码");
    return;
  }
  const form = readAdminCustomApiForm();
  if (form.enabled && (!form.textEndpoint || !form.apiKey)) {
    showToast("启用调试前需要填写文生图 API URL 和 API Key");
    return;
  }

  const button = $("#saveCustomApiConfigButton");
  button.disabled = true;
  button.textContent = "保存中...";
  setCustomApiAdminStatus("正在保存到服务器...");
  try {
    const response = await apiFetchPreferDirect("/api/admin/custom-api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify(form),
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "API 与定价保存",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || `保存失败：HTTP ${response.status}`);
    const serverConfig = payload.config || form;
    customDebugState.loaded = true;
    customDebugState.current = serverConfig;
    customDebugState.history = Array.isArray(payload.history) ? payload.history : [];
    customDebugState.global = payload.global || customDebugState.global;
    applyGlobalApiInfo(customDebugState.global || {});
    applyCustomApiRuntimeConfig(serverConfig);
    hydrateAdminCustomApiForm(serverConfig);
    renderAdminCustomHistory();
    setCustomApiAdminStatus(apiPricingStatus(serverConfig, customDebugState.global || {}));
    showToast(serverConfig.enabled ? "已切到站长自定义 API 调试" : "已保存调试配置，前台继续使用站点 API");
  } catch (error) {
    setCustomApiAdminStatus("保存失败");
    restoreAdminCustomApiForm();
    showToast(error.message || "保存自定义 API 调试配置失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>保存并应用</span>`;
    renderIcons();
  }
}

async function applyCustomApiAsGlobal() {
  const password = adminPassword();
  if (!password) {
    showToast("请先输入管理员密码");
    return;
  }
  const form = readAdminCustomApiForm();
  if (!form.textEndpoint || !form.apiKey) {
    showToast("设置全局 API 前需要填写文生图 API URL 和 API Key");
    return;
  }
  if (!Number.isFinite(form.priceCents) || form.priceCents <= 0) {
    showToast("售价需要大于 0 元/张");
    return;
  }

  const button = $("#applyGlobalApiConfigButton");
  button.disabled = true;
  button.textContent = "同步中...";
  setCustomApiAdminStatus("正在同步为全局 API 与定价...");
  try {
    const response = await apiFetchPreferDirect("/api/admin/custom-api/global", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify(form),
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "全局 API 同步",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || `同步失败：HTTP ${response.status}`);
    const serverConfig = payload.config || form;
    customDebugState.loaded = true;
    customDebugState.current = serverConfig;
    customDebugState.history = Array.isArray(payload.history) ? payload.history : customDebugState.history;
    customDebugState.global = payload.global || serverConfig;
    billingState.priceCents = Number(payload.priceCents || serverConfig.priceCents || billingState.priceCents);
    billingState.platformEnabled = true;
    billingState.platformRequestFormat = serverConfig.requestFormat === "json" ? "json" : "openai";
    billingState.platformTransportMode = serverConfig.transportMode === "direct" ? "direct" : "proxy";
    billingState.platformCustomTemplate = serverConfig.customTemplate || "";
    billingState.platformModelName = serverConfig.modelName || "";
    billingState.platformDisplayName = normalizeApiDisplayName(serverConfig.displayName || serverConfig.title || billingState.platformDisplayName);
    applyCustomApiRuntimeConfig(serverConfig);
    hydrateAdminCustomApiForm(serverConfig);
    renderAdminCustomHistory();
    renderWallet();
    setCustomApiAdminStatus("已设置为全局 API 与定价，全部用户实时生效");
    showToast("已设置为全局 API，售价也已同步到全站");
  } catch (error) {
    setCustomApiAdminStatus("同步失败");
    restoreAdminCustomApiForm();
    showToast(error.message || "设置全局 API 失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>设置为全局 API</span>`;
    renderIcons();
  }
}

function restoreAdminCustomApiForm() {
  if (!customDebugState.loaded) return;
  const fallback = customDebugState.current || { ...(customDebugState.global || {}), enabled: false };
  hydrateAdminCustomApiForm(fallback);
  applyCustomApiRuntimeConfig(customDebugState.current || {});
  setCustomApiAdminStatus(apiPricingStatus(customDebugState.current || {}, customDebugState.global || {}));
}

function readAdminCustomApiForm() {
  const textEndpoint = $("#adminCustomTextEndpoint")?.value.trim() || "";
  const editEndpoint = $("#adminCustomEditEndpoint")?.value.trim() || "";
  const transportMode = normalizeCustomTransportMode(textEndpoint, editEndpoint, $("#adminCustomTransportMode")?.value || "proxy");
  return {
    enabled: Boolean($("#adminCustomApiEnabled")?.checked),
    textEndpoint,
    editEndpoint,
    apiKey: $("#adminCustomApiKey")?.value.trim() || "",
    requestFormat: $("#adminCustomRequestFormat")?.value || "openai",
    transportMode,
    customTemplate: $("#adminCustomTemplate")?.value.trim() || defaultTemplate,
    modelName: FIXED_MODEL_NAME,
    priceCents: Math.max(1, Math.round(Number($("#adminCustomPriceYuan")?.value || 0) * 100)),
  };
}

function hasApiConfig(item = {}) {
  return Boolean(item.textEndpoint || item.editEndpoint || item.apiKey);
}

function applyGlobalApiInfo(item = {}) {
  if (!hasApiConfig(item)) return;
  billingState.priceCents = Number(item.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
  billingState.platformEnabled = true;
  billingState.platformRequestFormat = item.requestFormat === "json" ? "json" : "openai";
  billingState.platformTransportMode = item.transportMode === "direct" ? "direct" : "proxy";
  billingState.platformCustomTemplate = item.customTemplate || "";
  billingState.platformModelName = FIXED_MODEL_NAME;
  billingState.platformDisplayName = normalizeApiDisplayName(item.displayName || item.title || billingState.platformDisplayName);
}

function apiPricingStatus(debugConfig = {}, globalConfig = {}) {
  const globalText = hasApiConfig(globalConfig) ? `全局 ${formatPlatformPriceLabel(globalConfig.priceCents || billingState.priceCents)}` : "全局 API 尚未设置";
  if (debugConfig.enabled) return `本机调试已启用；${globalText}`;
  return `本机调试未启用；${globalText}`;
}

function hydrateAdminCustomApiForm(item = {}) {
  if ($("#adminCustomApiEnabled")) $("#adminCustomApiEnabled").checked = Boolean(item.enabled);
  if ($("#adminCustomTextEndpoint")) $("#adminCustomTextEndpoint").value = item.textEndpoint || "";
  if ($("#adminCustomEditEndpoint")) $("#adminCustomEditEndpoint").value = item.editEndpoint || "";
  if ($("#adminCustomApiKey")) $("#adminCustomApiKey").value = item.apiKey || "";
  if ($("#adminCustomRequestFormat")) $("#adminCustomRequestFormat").value = item.requestFormat || "openai";
  if ($("#adminCustomTransportMode")) {
    $("#adminCustomTransportMode").value = normalizeCustomTransportMode(item.textEndpoint || "", item.editEndpoint || "", item.transportMode || "proxy");
  }
  if ($("#adminCustomTemplate")) $("#adminCustomTemplate").value = item.customTemplate || defaultTemplate;
  if ($("#adminCustomModelName")) $("#adminCustomModelName").value = FIXED_MODEL_NAME;
  if ($("#adminCustomPriceYuan")) {
    const price = Number(item.priceCents || billingState.priceCents || PLATFORM_PRICE_FALLBACK_CENTS);
    $("#adminCustomPriceYuan").value = formatCodeAdminAmount(price / 100);
  }
  updateAdminCustomTemplateVisibility();
}

function applyCustomApiRuntimeConfig(item = {}) {
  customDebugState.enabled = Boolean(item.enabled);
  customDebugState.updatedAt = Number(item.updatedAt || Date.now());
  if (!customDebugState.enabled) {
    config.apiProvider = "platform";
    config.multiImageMode = "single";
    config.apiKey = "";
    config.rememberKey = false;
    config.requestFormat = "openai";
    config.transportMode = "direct";
    hydrateConfig();
    saveActiveConfig();
    updateApiProviderUi();
    return;
  }
  config.textEndpoint = item.textEndpoint || "";
  config.editEndpoint = item.editEndpoint || "";
  config.apiKey = item.apiKey || "";
  config.rememberKey = false;
  config.requestFormat = item.requestFormat || "openai";
  config.transportMode = normalizeCustomTransportMode(item.textEndpoint || "", item.editEndpoint || "", item.transportMode || "proxy");
  config.customTemplate = item.customTemplate || defaultTemplate;
  config.multiImageMode = "single";
  config.apiProvider = customDebugState.enabled ? "custom" : "platform";
  config.modelName = FIXED_MODEL_NAME;
  if ($("#modelName")) $("#modelName").value = FIXED_MODEL_NAME;
  hydrateConfig();
  saveActiveConfig();
  updateApiProviderUi();
}

function updateAdminCustomTemplateVisibility() {
  const field = $("#adminCustomTemplateField");
  if (field) field.hidden = ($("#adminCustomRequestFormat")?.value || "openai") !== "json";
}

function renderAdminCustomHistory() {
  const list = $("#adminCustomHistoryList");
  if (!list) return;
  if (!customDebugState.history.length) {
    list.innerHTML = `<div class="config-history-empty">保存后会在服务器保留最近 ${CONFIG_HISTORY_LIMIT} 条配置</div>`;
    return;
  }
  const usedNames = new Set();
  list.innerHTML = customDebugState.history
    .map((item, index) => {
      const displayName = uniqueHistoryDisplayName(item, index, usedNames);
      const endpointLabel = adminEndpointHistoryLabel(item);
      const keyLabel = item.apiKey ? maskApiKey(item.apiKey) : "未保存 Key";
      const transportLabel = item.transportMode === "proxy" ? "代理" : "直连";
      const formatLabel = item.requestFormat === "json" ? "JSON 模板" : "OpenAI";
      const priceLabel = formatPlatformPriceLabel(item.priceCents || billingState.priceCents);
      return `
        <div class="config-history-item" data-admin-custom-id="${escapeHtml(item.id || "")}">
          <button class="config-history-main" type="button" data-action="apply-admin-custom">
            <strong>${escapeHtml(displayName)}</strong>
            <span class="config-history-url" title="${escapeHtml(endpointLabel)}">${escapeHtml(endpointLabel)}</span>
            <small>${escapeHtml(item.modelName || "gpt-image-2")} · ${formatLabel} · ${transportLabel} · ${priceLabel} · 逐张稳定 · ${escapeHtml(keyLabel)}</small>
          </button>
          <button class="icon-button config-history-delete" type="button" data-action="delete-admin-custom" title="删除配置记录">
            <i data-icon="trash"></i>
          </button>
        </div>
      `;
    })
    .join("");
  renderIcons();
}

function onAdminCustomHistoryClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const row = event.target.closest("[data-admin-custom-id]");
  if (!action || !row) return;
  if (action === "delete-admin-custom") {
    deleteAdminCustomHistory(row.dataset.adminCustomId);
    return;
  }
  if (action !== "apply-admin-custom") return;
  const item = customDebugState.history.find((entry) => entry.id === row.dataset.adminCustomId);
  if (!item) return;
  hydrateAdminCustomApiForm({ ...item, enabled: true });
  showToast("已填入历史配置，确认后点击保存并应用");
}

async function deleteAdminCustomHistory(id) {
  const password = adminPassword();
  if (!password) {
    showToast("请先输入管理员密码");
    return;
  }
  if (!id) return;
  const previous = customDebugState.history;
  customDebugState.history = customDebugState.history.filter((entry) => entry.id !== id);
  renderAdminCustomHistory();
  setCustomApiAdminStatus("正在删除配置记录...");
  try {
    const response = await apiFetchPreferDirect("/api/admin/custom-api/history/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ id }),
      timeoutMs: ADMIN_API_TIMEOUT_MS,
    }, {
      directFirst: true,
      timeoutMs: ADMIN_API_TIMEOUT_MS,
      label: "配置记录删除",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || `删除失败：HTTP ${response.status}`);
    customDebugState.history = Array.isArray(payload.history) ? payload.history : customDebugState.history;
    customDebugState.global = payload.global || customDebugState.global;
    renderAdminCustomHistory();
    setCustomApiAdminStatus(apiPricingStatus(customDebugState.current || {}, customDebugState.global || {}));
    showToast("已删除配置记录");
  } catch (error) {
    customDebugState.history = previous;
    renderAdminCustomHistory();
    setCustomApiAdminStatus("删除失败");
    showToast(error.message || "删除配置记录失败");
  }
}

function setCustomApiAdminStatus(text) {
  const status = $("#customApiAdminStatus");
  if (status) status.textContent = text;
}

function updateRecommendedApiLabels() {
  const priceLabel = formatPlatformPriceLabel(billingState.priceCents);
  const label = `站点 API · ${priceLabel}`;
  const option = $('#apiProviderSelect option[value="platform"]');
  if (option) option.textContent = label;
  const intro = $("#platformPriceIntro");
  if (intro) intro.textContent = "本站使用GPT官方满血Image2模型。";
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
  const text = stripJsonBom(await response.text());
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: formatHttpError(response?.status || 0, text) } };
  }
}

function stripJsonBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

function apiUrl(path) {
  const value = String(path || "");
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

function apiFetch(path, options = {}) {
  return fetchApiUrl(apiUrl(path), options, "include");
}

async function apiFetchPreferDirect(path, options = {}, preference = {}) {
  const urls = uniqueUrls([
    ...(preference.directFirst ? [directPhpApiUrl(path), apiUrl(path)] : [apiUrl(path), directPhpApiUrl(path)]),
  ]);
  let lastError = null;
  let lastRetryableResponse = null;
  for (const url of urls) {
    const direct = isDirectPhpApiUrl(url);
    const startedAt = Date.now();
    try {
      const response = await fetchApiUrl(url, { ...options, timeoutMs: preference.timeoutMs || FAST_API_TIMEOUT_MS }, direct ? "omit" : "include");
      response.apiFetchUrl = url;
      if (response.ok || !shouldFallbackApiResponse(response, direct, preference)) return response;
      lastRetryableResponse = response;
      lastError = new Error(`${preference.label || "请求"}失败：HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (options.signal?.aborted) throw error;
      if (!isRetryableFetchError(error)) throw error;
      if (preference.noFetchErrorFallback) throw error;
      const maxFallbackMs = Number(preference.maxFetchErrorFallbackMs || 0);
      if (maxFallbackMs > 0 && Date.now() - startedAt > maxFallbackMs) throw error;
    }
  }
  if (lastRetryableResponse) return lastRetryableResponse;
  throw lastError || new Error(`${preference.label || "请求"}失败`);
}

function fetchApiUrl(url, options = {}, credentials = "include") {
  const { timeoutMs = 0, ...fetchOptions } = options;
  const headers = new Headers(options.headers || {});
  const sessionToken = billingState.sessionToken || readWalletSessionToken();
  if (sessionToken && !headers.has("X-Api2Image-Session")) {
    headers.set("X-Api2Image-Session", sessionToken);
  }
  return fetchWithTimeout(url, {
    ...fetchOptions,
    credentials,
    headers,
  }, timeoutMs);
}

function fetchWithTimeout(url, init = {}, timeoutMs = 0) {
  if (!timeoutMs) return fetch(url, init);
  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abortFromExternal = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abortFromExternal, { once: true });
  }
  return fetch(url, { ...init, signal: controller.signal })
    .catch((error) => {
      if (timedOut) throw new Error(`请求超时，请重试`);
      throw error;
    })
    .finally(() => {
      clearTimeout(timeout);
      if (externalSignal) externalSignal.removeEventListener("abort", abortFromExternal);
    });
}

function directPhpApiUrl(path) {
  const base = normalizeDirectApiBase(billingState.directBaseUrl || DEFAULT_PHP_API_BASE);
  const value = String(path || "");
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

function isDirectPhpApiUrl(url) {
  return normalizeDirectApiBase(url).startsWith(normalizeDirectApiBase(billingState.directBaseUrl || DEFAULT_PHP_API_BASE));
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

function shouldFallbackApiResponse(response, direct, preference = {}) {
  if (preference.noHttpFallback) return false;
  if (isRetryableHttpStatus(response.status)) return true;
  if (direct && response.status === 401 && !currentWalletSessionToken()) return true;
  return false;
}

function isRetryableHttpStatus(status) {
  return [500, 502, 503, 504, 520, 522, 524].includes(Number(status));
}

function isRetryableFetchError(error) {
  return /failed to fetch|network|timeout|timed out|请求超时|load failed|connection|socket|reset|abort/i.test(error?.message || String(error));
}

function updateApiProviderUi() {
  const usingPlatform = isPlatformApiSelected();
  $("#settingsPanel")?.classList.toggle("platform-selected", usingPlatform);
  $("#walletToggle").classList.toggle("active", usingPlatform);
  syncDebugApiModeIndicator();
  updateRecommendedApiLabels();
}

function isPlatformApiSelected() {
  return !isCustomApiDebugEnabled();
}

function isCustomApiDebugEnabled() {
  return Boolean(customDebugState.enabled);
}

function syncDebugApiModeIndicator() {
  const banner = $("#debugApiModeBanner");
  if (!banner) return;
  const active = isCustomApiDebugEnabled();
  banner.hidden = !active;
  const label = banner.querySelector("span");
  if (label) {
    const name = normalizeApiDisplayName(customDebugState.current?.title || config.title || "");
    label.textContent = active ? `调试API模式 · ${name} · 仅本机生效` : "调试API模式";
  }
}

function updateBillingFromGenerationResponse(response) {
  const balance = Number(response.headers.get("X-Platform-Balance-Cents"));
  if (Number.isFinite(balance)) {
    billingState.balanceCents = balance;
    renderWallet();
  }
}

function formatSignedMoney(cents) {
  const value = Number(cents || 0);
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatMoney(value)}`;
}

function walletLedgerTypeLabel(type) {
  const labels = {
    redeem: "充值码到账",
    charge: "站点 API 扣费",
    refund: "生成失败退款",
    adjust: "余额调整",
  };
  return labels[type] || "余额变动";
}

function formatMoney(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function formatWalletTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
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

function normalizeContactEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || email.length > 254) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
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

async function persistableImageSource(src, timeoutMs = RESULT_CACHE_TIMEOUT_MS) {
  if (!src || src.startsWith("data:")) return src;
  if ((config.transportMode === "proxy" || isPlatformApiSelected()) && /^https?:\/\//i.test(src)) {
    try {
      const response = await fetchWithTimeout("/api/cache-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: src }),
      }, timeoutMs);
      const payload = await response.json();
      if (response.ok && payload.dataUrl) return payload.dataUrl;
    } catch {
      // Browser fetch below is still useful when the image server allows CORS.
    }
  }

  try {
    const response = await fetchWithTimeout(src, { cache: "no-store" }, timeoutMs);
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
  const apiDisplayName = currentApiDisplayName(endpoint, options);
  const log = {
    id: makeId(),
    generationId: options.generationId || "",
    status: "running",
    startedAt: Date.now(),
    endedAt: 0,
    durationMs: 0,
    endpoint,
    apiDisplayName,
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
  const apiDisplayName = currentApiDisplayName(endpoint, options);
  const entry = {
    id: makeId(),
    label: meta.label || requestLogLabel(options),
    variant: meta.variant || "",
    status: "pending",
    startedAt: Date.now(),
    endedAt: 0,
    durationMs: 0,
    endpoint,
    apiDisplayName,
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
      const apiName = visibleLogApiName(log, index);
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
            <span>${escapeHtml(apiName)}</span>
            <span>${escapeHtml(summary)}</span>
            <span>请求 ${requestCount} 次</span>
            <span>返回图片 ${Number(log.imageCount) || 0} 张</span>
            ${log.durationMs ? `<span>用时 ${formatDurationLabel(log.durationMs)}</span>` : ""}
          </div>
          ${log.message ? `<p class="log-message">${escapeHtml(log.message)}</p>` : ""}
          ${log.error ? `<p class="log-error">${escapeHtml(log.error)}</p>` : ""}
          <div class="log-endpoint">${escapeHtml(apiName)}</div>
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
          <small>${escapeHtml(entry.durationMs ? `${formatDurationLabel(entry.durationMs)}` : "进行中")}</small>
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
      <span>${escapeHtml(visibleLogApiName(log))}</span>
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
        <small>${escapeHtml(entry.durationMs ? `${formatDurationLabel(entry.durationMs)}` : "进行中")}</small>
        <small class="log-cost">${escapeHtml(formatMoney(entry.costCents || 0))} 元</small>
      </summary>
      <pre>${escapeHtml(text)}</pre>
    </details>
  `;
}

function requestLogText(entry) {
  return [
    `站点配置:\n${visibleLogApiName(entry)}`,
    `提示词:\n${entry.prompt || ""}`,
    `请求变体:\n${entry.variant || "-"}`,
    `参数:\n${summarizeLogValue(entry.params)}`,
    `请求:\n${summarizeLogValue(entry.request)}`,
    `本张花费:\n${formatMoney(entry.costCents || 0)} 元`,
    `API 返回:\nHTTP ${entry.httpStatus || "-"} · ${entry.contentType || "unknown"} · 图片 ${entry.imageCount || 0} 张\n${redactSensitiveApiUrls(entry.responsePreview || entry.error || "暂无返回")}`,
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
    displayName: entry.displayName || entry.apiDisplayName || "",
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
  const apiKeyForStats = options.statsApiKey || config.apiKey;
  const keyFingerprint = await fingerprintApiKey(apiKeyForStats);
  const statKey = apiStatKey({ endpoint, keyFingerprint, mode: options.mode || "text", model: options.model || "" });
  const requestId = apiUsageRequestId(options);
  const requestRecordKey = requestId ? `${statKey}|${requestId}` : "";
  const previousContribution = requestRecordKey ? apiUsageRecords.get(requestRecordKey) : null;
  const contribution = apiUsageContribution(requestLog, details, options);
  const existing = apiStats.find((entry) => apiStatKey(entry) === statKey);
  const stat =
    existing ||
    normalizeApiStat({
      id: makeId(),
      endpoint,
      endpointHost: endpointHostLabel(endpoint),
      displayName: currentApiDisplayName(endpoint, options),
      keyFingerprint,
      keyLabel: maskApiKey(apiKeyForStats) || "未填写 Key",
      mode: options.mode || "text",
      model: options.model || "",
      firstUsedAt: now,
    });

  stat.endpoint = endpoint || "";
  stat.endpointHost = endpointHostLabel(endpoint);
  stat.displayName = currentApiDisplayName(endpoint, options);
  stat.keyFingerprint = keyFingerprint;
  stat.keyLabel = maskApiKey(apiKeyForStats) || "未填写 Key";
  stat.mode = options.mode || stat.mode || "text";
  stat.model = options.model || stat.model || "";
  if (previousContribution) {
    removeApiUsageContribution(stat, previousContribution);
  }
  addApiUsageContribution(stat, contribution);
  stat.lastUsedAt = now;
  stat.lastStatus = details.status || requestLog?.status || "";
  stat.lastHttpStatus = Number(requestLog?.httpStatus || 0);
  stat.lastError = details.error ? truncateText(redactSensitiveApiUrls(details.error), 220) : redactSensitiveApiUrls(requestLog?.error || "");
  if (requestRecordKey) {
    apiUsageRecords.set(requestRecordKey, contribution);
    while (apiUsageRecords.size > 500) {
      apiUsageRecords.delete(apiUsageRecords.keys().next().value);
    }
  }

  apiStats = mergeApiStats([stat, ...apiStats.filter((entry) => entry.id !== stat.id)]);
  saveApiStats();
  renderApiStats();
}

function apiUsageRequestId(options = {}) {
  const value = String(options.billingRequestId || options.requestId || "").trim();
  return value ? value.slice(0, 160) : "";
}

function apiUsageContribution(requestLog = null, details = {}, options = {}) {
  const success = details.status === "success";
  const returnedImages = Math.max(0, Math.round(Number(requestLog?.imageCount || 0)));
  const requestedImages = Math.max(1, Math.round(Number(options.count || 1)));
  return {
    total: 1,
    success: success ? 1 : 0,
    failed: success ? 0 : 1,
    images: success ? Math.min(returnedImages, requestedImages) : 0,
  };
}

function addApiUsageContribution(stat, contribution) {
  stat.total += Number(contribution.total || 0);
  stat.success += Number(contribution.success || 0);
  stat.failed += Number(contribution.failed || 0);
  stat.images += Number(contribution.images || 0);
}

function removeApiUsageContribution(stat, contribution) {
  stat.total = Math.max(0, stat.total - Number(contribution.total || 0));
  stat.success = Math.max(0, stat.success - Number(contribution.success || 0));
  stat.failed = Math.max(0, stat.failed - Number(contribution.failed || 0));
  stat.images = Math.max(0, stat.images - Number(contribution.images || 0));
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
      existing.displayName = stat.displayName || existing.displayName;
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
    .map((item, index) => {
      const okRate = item.total ? Math.round((item.success / item.total) * 100) : 0;
      const displayName = normalizeApiDisplayName(item.displayName, index);
      return `
        <article class="api-stat-card" data-api-stat-id="${escapeHtml(item.id)}">
          <div class="api-stat-head">
            <strong>${escapeHtml(displayName)}</strong>
            <div class="api-stat-actions">
              <span>${escapeHtml(item.lastStatus === "success" ? "成功" : item.lastStatus === "failed" ? "失败" : "记录")}</span>
              <button class="icon-button api-stat-delete" type="button" data-action="delete-api-stat" title="删除此记录">
                <i data-icon="x"></i>
              </button>
            </div>
          </div>
          <div class="api-stat-endpoint">${escapeHtml("站点 API 配置")}</div>
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
  renderIcons();
}

function clearApiStats() {
  apiStats = [];
  apiUsageRecords = new Map();
  saveApiStats();
  renderApiStats();
  showToast("API 统计已清空");
}

function onApiStatsListClick(event) {
  const button = event.target.closest("[data-action='delete-api-stat']");
  const item = event.target.closest("[data-api-stat-id]");
  if (!button || !item) return;
  deleteApiStat(item.dataset.apiStatId);
}

function deleteApiStat(id) {
  const statId = String(id || "").trim();
  if (!statId) return;
  const before = apiStats.length;
  apiStats = apiStats.filter((item) => item.id !== statId);
  if (apiStats.length === before) return;
  saveApiStats();
  renderApiStats();
  showToast("该 API 统计记录已删除");
}

async function refreshSiteStatsFromPanel() {
  const button = $("#refreshStatsButton");
  if (button) {
    button.disabled = true;
    button.textContent = "刷新中...";
  }
  try {
    await loadSiteStats({ silent: false });
    renderApiStats();
    showToast("统计已刷新");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = `<i data-icon="rotate"></i><span>刷新统计</span>`;
      renderIcons();
    }
  }
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
    if (request.payloadVariant) summary.payloadVariant = request.payloadVariant;
    if (request.fileFieldMode) summary.fileFieldMode = request.fileFieldMode;
    summary.fields = sanitizeForLog(request.fields || {});
    summary.files = (request.files || []).map((file) => ({
      field: file.field,
      filename: file.filename,
      normalizedForApi: Boolean(file.normalizedForApi),
      originalBytes: file.originalBytes || "",
      outputBytes: file.outputBytes || "",
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
    return truncateText(redactSensitiveApiUrls(redactSecrets(value)), 2400);
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

function redactSensitiveApiUrls(value) {
  return String(value || "").replace(/https?:\/\/[^\s"'<>]+\/v1\/images\/(?:generations|edits)\b[^\s"'<>]*/gi, "[站点 API 地址已隐藏]");
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
    if (currentProgress >= 88) return;
    const elapsed = (Date.now() - progressStartedAt) / 1000;
    const softCap = elapsed > 75 ? 88 : elapsed > 45 ? 86 : 82;
    const eased = Math.min(softCap, 20 + Math.log2(elapsed + 1) * 12.5);
    applyProgress("等待模型生成", `模型仍在生成，已等待 ${formatDurationLabel(elapsed * 1000)}`, Math.max(currentProgress, eased));
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

function formatDurationLabel(milliseconds) {
  const totalSeconds = Math.max(1, Math.round(Number(milliseconds || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}\u5206${seconds}\u79d2`;
}

function ensureModelOption(model) {
  const input = $("#modelName");
  if (input) input.value = FIXED_MODEL_NAME;
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

function getImageDimensionsSafe(src, timeoutMs = 0) {
  return new Promise((resolve) => {
    if (!src) {
      resolve({ width: 1, height: 1 });
      return;
    }
    const image = new Image();
    let timer = null;
    const finish = (dimensions) => {
      if (timer) clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(dimensions);
    };
    image.onload = () => finish({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => finish({ width: 1, height: 1 });
    if (timeoutMs > 0) timer = setTimeout(() => finish({ width: 1, height: 1 }), timeoutMs);
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

async function loadAnnouncements(options = {}) {
  try {
    const response = await fetch("/api/site/announcements?limit=20");
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "公告加载失败");
    announcementState.items = normalizeAnnouncements(Array.isArray(payload.announcements) ? payload.announcements : []);
    announcementState.latestAt = announcementState.items.reduce(
      (max, item) => Math.max(max, Number(item.updatedAt || item.createdAt || 0)),
      0,
    );
    announcementState.seenAt = getAnnouncementsSeenAt();
    renderAnnouncements();
    maybeShowAnnouncements(Boolean(options.forceOpen));
    startAnnouncementPolling();
    scheduleAnnouncementAutoOpen();
    return announcementState.items;
  } catch (error) {
    console.warn("公告加载失败", error);
    if (!options.silent) showToast(error.message || "公告加载失败");
    return [];
  }
}

function normalizeAnnouncements(items) {
  return [...items]
    .map((item) => ({
      id: String(item.id || ""),
      title: String(item.title || "").trim() || "站点公告",
      body: String(item.body || "").trim(),
      pinned: Boolean(item.pinned),
      pinnedAt: Number(item.pinnedAt || 0),
      createdAt: Number(item.createdAt || 0),
      updatedAt: Number(item.updatedAt || item.createdAt || 0),
    }))
    .filter((item) => item.id && item.body)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      if (a.pinned && b.pinned) {
        const pinnedDelta = Number(a.pinnedAt || a.updatedAt || a.createdAt || 0) - Number(b.pinnedAt || b.updatedAt || b.createdAt || 0);
        if (pinnedDelta) return pinnedDelta;
      }
      const delta = Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0);
      if (delta) return delta;
      return String(b.id).localeCompare(String(a.id));
    });
}

function getAnnouncementsSeenAt() {
  try {
    return Math.max(0, Number(localStorage.getItem(ANNOUNCEMENTS_SEEN_KEY) || 0));
  } catch {
    return 0;
  }
}

function markAnnouncementsSeen(timestamp = announcementState.latestAt || Date.now()) {
  const seenAt = Math.max(0, Number(timestamp || 0));
  if (!seenAt) return;
  announcementState.seenAt = Math.max(Number(announcementState.seenAt || 0), seenAt);
  try {
    localStorage.setItem(ANNOUNCEMENTS_SEEN_KEY, String(announcementState.seenAt));
  } catch {}
  announcementState.unreadCount = countUnreadAnnouncements();
  renderAnnouncements();
}

function countUnreadAnnouncements() {
  const seenAt = Number(announcementState.seenAt || 0);
  return announcementState.items.filter((item) => Number(item.updatedAt || item.createdAt || 0) > seenAt).length;
}

function renderAnnouncements() {
  const unread = countUnreadAnnouncements();
  announcementState.unreadCount = unread;
  renderAnnouncementBadge();

  const list = $("#announcementList");
  if (list) {
    if (!announcementState.items.length) {
      list.innerHTML = `<div class="log-empty">暂无公告</div>`;
    } else {
      list.innerHTML = announcementState.items
        .map((item) => {
          const stamp = Number(item.updatedAt || item.createdAt || 0);
          const unreadClass = stamp > Number(announcementState.seenAt || 0) ? " unread" : "";
          const pinnedClass = item.pinned ? " pinned" : "";
          return `
            <article class="announcement-item${unreadClass}${pinnedClass}">
              <div class="announcement-head">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(announcementMetaLabel(item, stamp))}</small>
              </div>
              <p>${escapeHtml(item.body).replace(/\n/g, "<br />")}</p>
            </article>
          `;
        })
        .join("");
    }
  }

  const popupList = $("#announcementPopupList");
  if (popupList) {
    popupList.innerHTML = announcementState.items.length
      ? announcementState.items
          .map((item) => {
            const stamp = Number(item.updatedAt || item.createdAt || 0);
            const pinnedClass = item.pinned ? " pinned" : "";
            return `
              <article class="announcement-item${pinnedClass}">
                <div class="announcement-head">
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(announcementMetaLabel(item, stamp))}</small>
                </div>
                <p>${escapeHtml(item.body).replace(/\n/g, "<br />")}</p>
              </article>
            `;
          })
          .join("")
      : `<div class="log-empty">暂无公告</div>`;
  }

  const adminList = $("#announcementAdminList");
  if (adminList) {
    adminList.innerHTML = announcementState.items.length
      ? announcementState.items
          .map((item) => {
            const stamp = Number(item.updatedAt || item.createdAt || 0);
            const pinnedClass = item.pinned ? " pinned" : "";
            return `
              <article class="announcement-admin-item${pinnedClass}" data-announcement-id="${escapeHtml(item.id)}">
                <div class="announcement-admin-main">
                  <div class="announcement-head">
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(announcementMetaLabel(item, stamp))}</small>
                  </div>
                  <p>${escapeHtml(item.body).replace(/\n/g, "<br />")}</p>
                </div>
                <button class="icon-button announcement-pin-button${item.pinned ? " active" : ""}" type="button" data-action="toggle-announcement-pin" data-pinned="${item.pinned ? "1" : "0"}" title="${item.pinned ? "取消置顶" : "置顶公告"}">
                  <i data-icon="pin"></i>
                </button>
                <button class="icon-button announcement-delete-button" type="button" data-action="delete-announcement" title="删除公告">
                  <i data-icon="trash"></i>
                </button>
              </article>
            `;
          })
          .join("")
      : `<div class="log-empty">暂无已发布公告</div>`;
    renderIcons();
  }
}

function renderAnnouncementBadge() {
  const badge = $("#announcementBadge");
  if (!badge) return;
  const unread = Number(announcementState.unreadCount || 0);
  badge.hidden = unread <= 0;
  badge.textContent = unread > 9 ? "9+" : String(unread);
}

function announcementMetaLabel(item, timestamp) {
  const time = formatAnnouncementTime(timestamp);
  return item?.pinned ? `置顶${time ? ` · ${time}` : ""}` : time;
}

function maybeShowAnnouncements(force = false) {
  const popup = $("#announcementPopup");
  if (!popup || !announcementState.items.length) return;
  const seenAt = Number(announcementState.seenAt || 0);
  const hasUnread = announcementState.items.some((item) => Number(item.updatedAt || item.createdAt || 0) > seenAt);
  const shouldShow = force || (hasUnread && Number(announcementState.latestAt || 0) > Number(announcementState.lastAutoPopupAt || 0));
  if (!shouldShow) return;
  popup.hidden = false;
  announcementState.lastAutoPopupAt = Number(announcementState.latestAt || Date.now());
  markAnnouncementsSeen(announcementState.latestAt || Date.now());
}

function scheduleAnnouncementAutoOpen() {
  if (announcementAutoOpenTimer) clearTimeout(announcementAutoOpenTimer);
  const seenAt = Number(announcementState.seenAt || 0);
  const hasUnread = announcementState.items.some((item) => Number(item.updatedAt || item.createdAt || 0) > seenAt);
  if (!announcementState.items.length || (!hasUnread && seenAt > 0)) return;
  announcementAutoOpenTimer = setTimeout(() => {
    announcementAutoOpenTimer = null;
    maybeShowAnnouncements(false);
  }, 450);
}

function closeAnnouncementPopup() {
  const popup = $("#announcementPopup");
  if (popup) popup.hidden = true;
}

function startAnnouncementPolling() {
  if (announcementRefreshTimer) return;
  announcementRefreshTimer = setInterval(() => {
    loadAnnouncements({ silent: true });
  }, ANNOUNCEMENTS_REFRESH_INTERVAL_MS);
}

function stopAnnouncementPolling() {
  if (announcementRefreshTimer) clearInterval(announcementRefreshTimer);
  announcementRefreshTimer = null;
}

function openAnnouncementAdminPanel() {
  closeAnnouncementPopup();
  openCodeAdminPanel("announcements");
  $("#walletPanel").classList.remove("open");
  $("#settingsPanel").classList.remove("open");
  $("#logsPanel").classList.remove("open");
  $("#announcementAdminSection")?.classList.add("highlight");
  setTimeout(() => $("#announcementAdminSection")?.classList.remove("highlight"), 1800);
  setTimeout(() => $("#announcementTitle")?.focus(), 150);
}

async function publishAnnouncementFromPanel() {
  const password = $("#codeAdminPassword").value.trim();
  const title = $("#announcementTitle").value.trim();
  const body = $("#announcementBody").value.trim();
  const pinned = $("#announcementPinned").checked;
  if (!password) {
    showToast("请输入管理密码");
    return;
  }
  if (!body) {
    showToast("请填写公告内容");
    return;
  }

  const button = $("#publishAnnouncementButton");
  button.disabled = true;
  button.textContent = "发布中...";
  try {
    const response = await fetch("/api/billing/admin/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ title, body, pinned }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "发布公告失败");
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    $("#announcementTitle").value = "";
    $("#announcementBody").value = "";
    $("#announcementPinned").checked = false;
    await loadAnnouncements({ silent: true, forceOpen: true });
    showToast("公告已发布，前台立即生效");
  } catch (error) {
    showToast(error.message || "发布公告失败");
  } finally {
    button.disabled = false;
    button.innerHTML = `<i data-icon="check"></i><span>发布公告</span>`;
    renderIcons();
  }
}

function onAnnouncementAdminClick(event) {
  const button = event.target.closest("[data-action]");
  const item = event.target.closest("[data-announcement-id]");
  if (!button || !item) return;
  const action = button.dataset.action;
  if (action === "delete-announcement") {
    deleteAnnouncementFromPanel(item.dataset.announcementId, button);
  } else if (action === "toggle-announcement-pin") {
    toggleAnnouncementPinnedFromPanel(item.dataset.announcementId, button.dataset.pinned !== "1", button);
  }
}

async function toggleAnnouncementPinnedFromPanel(id, pinned, button = null) {
  const announcementId = String(id || "").trim();
  if (!announcementId) return;
  const password = $("#codeAdminPassword").value.trim();
  if (!password) {
    showToast("请输入管理密码");
    return;
  }

  if (button) button.disabled = true;
  try {
    const response = await fetch(`/api/billing/admin/announcements?id=${encodeURIComponent(announcementId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password,
      },
      body: JSON.stringify({ pinned }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "更新公告失败");
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    await loadAnnouncements({ silent: true });
    showToast(pinned ? "公告已置顶" : "公告已取消置顶");
  } catch (error) {
    showToast(error.message || "更新公告失败");
  } finally {
    if (button) button.disabled = false;
  }
}

async function deleteAnnouncementFromPanel(id, button = null) {
  const announcementId = String(id || "").trim();
  if (!announcementId) return;
  const password = $("#codeAdminPassword").value.trim();
  if (!password) {
    showToast("请输入管理密码");
    return;
  }
  if (!window.confirm("确定删除这条公告吗？删除后前台将不再展示。")) return;

  if (button) button.disabled = true;
  try {
    const response = await fetch(`/api/billing/admin/announcements?id=${encodeURIComponent(announcementId)}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": password },
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload?.error?.message || "删除公告失败");
    localStorage.setItem(CODE_ADMIN_PASSWORD_KEY, password);
    await loadAnnouncements({ silent: true });
    showToast("公告已删除，前台已同步更新");
  } catch (error) {
    showToast(error.message || "删除公告失败");
  } finally {
    if (button) button.disabled = false;
  }
}

function formatAnnouncementTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

init();
