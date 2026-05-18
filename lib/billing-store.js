const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_DB = {
  customers: {},
  sessions: {},
  orders: {},
  usage: {},
  redeemCodes: {},
  redemptions: {},
  settings: {},
  announcements: {
    ann_welcome: {
      id: "ann_welcome",
      title: "隐私说明",
      body: "本站的 API 配置仅保存在你的本地浏览器，不会上传到服务器；生成的图片也会保存在本地，方便查看和管理。",
      pinned: true,
      pinnedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  },
  siteStats: {
    totalVisits: 0,
    totalVisitors: 0,
    dailyVisits: {},
    lastVisitAt: 0,
    updatedAt: 0,
  },
};

class BillingStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.initPromise = null;
    this.writeQueue = Promise.resolve();
  }

  async ensureReady() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      try {
        await fs.access(this.filePath);
      } catch {
        await this.writeDb(structuredClone(DEFAULT_DB));
      }
    })();
    return this.initPromise;
  }

  async readDb() {
    await this.ensureReady();
    const raw = await fs.readFile(this.filePath, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return normalizeDb(parsed);
  }

  async writeDb(db) {
    const normalized = normalizeDb(db);
    const tempPath = `${this.filePath}.tmp`;
    await fs.writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
    await replaceFileWithRetry(tempPath, this.filePath);
  }

  async mutate(mutator) {
    let result;
    const operation = this.writeQueue.catch(() => {}).then(async () => {
      const db = await this.readDb();
      result = await mutator(db);
      await this.writeDb(db);
    });
    this.writeQueue = operation.catch(() => {});
    await operation;
    return result;
  }

  async readOnly(reader) {
    const db = await this.readDb();
    return reader(db);
  }

  async getOrCreateSession(sessionToken) {
    if (sessionToken) {
      const existing = await this.readOnly((db) => {
        const session = db.sessions[sessionToken];
        if (!session) return null;
        const customer = db.customers[session.customerId];
        if (!customer) return null;
        return {
          sessionToken,
          customerId: customer.id,
        };
      });
      if (existing) {
        await this.touchSession(existing.sessionToken);
        return existing;
      }
    }

    return this.mutate((db) => {
      const customerId = makeId("cus");
      const sessionId = makeId("sess");
      const now = Date.now();
      const siteStats = normalizeSiteStats(db.siteStats);
      db.customers[customerId] = {
        id: customerId,
        balanceCents: 0,
        totalSpentCents: 0,
        totalRechargedCents: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.sessions[sessionId] = {
        id: sessionId,
        customerId,
        createdAt: now,
        lastSeenAt: now,
      };
      siteStats.totalVisitors += 1;
      siteStats.updatedAt = now;
      db.siteStats = siteStats;
      return {
        sessionToken: sessionId,
        customerId,
      };
    });
  }

  async touchSession(sessionToken) {
    if (!sessionToken) return;
    await this.mutate((db) => {
      const session = db.sessions[sessionToken];
      if (!session) return;
      session.lastSeenAt = Date.now();
    });
  }

  async getSiteStats(onlineWindowMs = 3 * 60 * 1000) {
    return this.readOnly((db) => {
      const siteStats = normalizeSiteStats(db.siteStats);
      const now = Date.now();
      const onlineCount = Object.values(db.sessions).reduce((count, session) => {
        return count + (now - Number(session.lastSeenAt || 0) <= onlineWindowMs ? 1 : 0);
      }, 0);
      const totalVisitors = Math.max(Number(siteStats.totalVisitors || 0), Object.keys(db.sessions).length);
      const todayKey = getDateKey(now);
      return {
        onlineCount,
        totalVisits: Number(siteStats.totalVisits || 0),
        todayVisits: Number(siteStats.dailyVisits?.[todayKey] || 0),
        totalVisitors,
        lastVisitAt: Number(siteStats.lastVisitAt || 0),
        updatedAt: Number(siteStats.updatedAt || 0),
        onlineWindowMs,
      };
    });
  }

  async recordSiteTrack(sessionToken, kind = "visit") {
    if (!sessionToken) return null;
    return this.mutate((db) => {
      const session = db.sessions[sessionToken];
      if (!session) return null;
      const now = Date.now();
      const siteStats = normalizeSiteStats(db.siteStats);
      session.lastSeenAt = now;
      if (String(kind || "visit").toLowerCase() === "visit") {
        const todayKey = getDateKey(now);
        siteStats.totalVisits += 1;
        siteStats.dailyVisits[todayKey] = Number(siteStats.dailyVisits[todayKey] || 0) + 1;
        siteStats.lastVisitAt = now;
      }
      siteStats.updatedAt = now;
      db.siteStats = siteStats;
      return {
        session: { ...session },
        siteStats: { ...siteStats },
      };
    });
  }

  async getDashboard(customerId, options = {}) {
    const orderLimit = Math.max(1, Number(options.orderLimit || 10));
    const usageLimit = Math.max(1, Number(options.usageLimit || 12));
    const redemptionLimit = Math.max(1, Number(options.redemptionLimit || 12));
    return this.readOnly((db) => {
      const customer = ensureCustomerRecord(db, customerId);
      const orders = valuesByCustomer(db.orders, customerId).slice(0, orderLimit);
      const usage = valuesByCustomer(db.usage, customerId).slice(0, usageLimit);
      const redemptions = valuesByCustomer(db.redemptions, customerId).slice(0, redemptionLimit);
      return {
        customer: { ...customer },
        orders,
        usage,
        redemptions,
      };
    });
  }

  async createRedeemCodes(items = []) {
    return this.mutate((db) => {
      const now = Date.now();
      const created = [];
      for (const item of items) {
        const code = normalizeRedeemCode(item.code);
        const amountCents = Math.max(1, Number(item.amountCents || 0));
        if (!code || !amountCents) continue;
        if (db.redeemCodes[code]) throw new Error(`兑换码已存在：${code}`);
        const record = {
          code,
          amountCents,
          label: String(item.label || "").trim(),
          status: "active",
          createdAt: now,
          updatedAt: now,
          usedAt: 0,
          usedBy: "",
          redemptionId: "",
        };
        db.redeemCodes[code] = record;
        created.push({ ...record });
      }
      return created;
    });
  }

  async redeemCode(customerId, rawCode, rawEmail = "") {
    const code = normalizeRedeemCode(rawCode);
    const email = normalizeEmail(rawEmail);
    if (!code) throw new Error("请输入兑换码");
    if (!email) throw new Error("请输入购买时填写的邮箱");
    return this.mutate((db) => {
      const customer = ensureCustomerRecord(db, customerId);
      const record = db.redeemCodes[code];
      if (!record) throw new Error("兑换码不存在");
      if (record.status !== "active" || record.usedAt || record.usedBy) throw new Error("兑换码已使用或已失效");

      const now = Date.now();
      const redemption = {
        id: makeId("rdm"),
        code,
        customerId,
        contactEmailHash: hashContactEmail(email),
        contactEmailMasked: maskEmail(email),
        amountCents: Number(record.amountCents || 0),
        label: record.label || "",
        createdAt: now,
      };
      record.status = "used";
      record.usedAt = now;
      record.usedBy = customerId;
      record.redemptionId = redemption.id;
      record.updatedAt = now;
      db.redemptions[redemption.id] = redemption;
      customer.balanceCents += redemption.amountCents;
      customer.totalRechargedCents += redemption.amountCents;
      customer.updatedAt = now;
      return {
        redemption: { ...redemption },
        customer: { ...customer },
      };
    });
  }

  async restoreByEmailAndCode(currentSessionToken, rawEmail, rawCode) {
    const email = normalizeEmail(rawEmail);
    const code = normalizeRedeemCode(rawCode);
    if (!email) throw new Error("请输入购买时填写的邮箱");
    if (!code) throw new Error("请输入邮件里的兑换码");

    return this.mutate((db) => {
      const record = db.redeemCodes[code];
      if (!record || !record.usedBy || !record.redemptionId) throw new Error("没有找到这张卡密的兑换记录");
      const redemption = db.redemptions[record.redemptionId];
      if (!redemption || redemption.customerId !== record.usedBy) throw new Error("兑换记录不完整，请联系站长处理");
      const storedHash = redemption.contactEmailHash || hashContactEmail(redemption.contactEmail || "");
      if (!storedHash || storedHash !== hashContactEmail(email)) throw new Error("邮箱和卡密不匹配");

      const customer = ensureCustomerRecord(db, redemption.customerId);
      const now = Date.now();
      let session = currentSessionToken ? db.sessions[currentSessionToken] : null;
      if (!session) {
        const sessionToken = makeId("sess");
        session = {
          id: sessionToken,
          customerId: customer.id,
          createdAt: now,
          lastSeenAt: now,
          restoredAt: now,
        };
        db.sessions[sessionToken] = session;
      } else {
        session.customerId = customer.id;
        session.lastSeenAt = now;
        session.restoredAt = now;
      }
      customer.updatedAt = now;
      return {
        sessionToken: session.id,
        customer: { ...customer },
        redemption: { ...redemption },
      };
    });
  }

  async listRedeemCodes(limit = 50) {
    return this.readOnly((db) =>
      Object.values(db.redeemCodes)
        .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
        .slice(0, limit)
        .map((item) => ({ ...item })),
    );
  }

  async listAnnouncements(limit = 20) {
    return this.readOnly((db) =>
      Object.values(db.announcements)
        .sort((a, b) => {
          if (Boolean(a.pinned) !== Boolean(b.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
          if (a.pinned && b.pinned) {
            const pinnedDelta = Number(a.pinnedAt || a.updatedAt || a.createdAt || 0) - Number(b.pinnedAt || b.updatedAt || b.createdAt || 0);
            if (pinnedDelta) return pinnedDelta;
          }
          const createdDelta = Number(b.createdAt || 0) - Number(a.createdAt || 0);
          if (createdDelta) return createdDelta;
          return String(b.id || "").localeCompare(String(a.id || ""));
        })
        .slice(0, limit)
        .map((item) => ({ ...item })),
    );
  }

  async createAnnouncement(payload = {}) {
    const title = String(payload.title || "").trim().slice(0, 120);
    const body = String(payload.body || payload.content || payload.text || "").trim().slice(0, 4000);
    if (!body) throw new Error("公告内容不能为空");
    const pinned = Boolean(payload.pinned);
    return this.mutate((db) => {
      const now = Date.now();
      const announcement = {
        id: makeId("ann"),
        title: title || deriveAnnouncementTitle(body),
        body,
        pinned,
        pinnedAt: pinned ? now : 0,
        createdAt: now,
        updatedAt: now,
      };
      db.announcements[announcement.id] = announcement;
      return { ...announcement };
    });
  }

  async deleteAnnouncement(id) {
    const announcementId = String(id || "").trim();
    if (!announcementId) throw new Error("公告 ID 缺失");
    return this.mutate((db) => {
      if (!db.announcements[announcementId]) throw new Error("公告不存在或已删除");
      const deleted = { ...db.announcements[announcementId] };
      delete db.announcements[announcementId];
      return deleted;
    });
  }

  async updateAnnouncement(id, updates = {}) {
    const announcementId = String(id || "").trim();
    if (!announcementId) throw new Error("公告 ID 缺失");
    return this.mutate((db) => {
      if (!db.announcements[announcementId]) throw new Error("公告不存在或已删除");
      const now = Date.now();
      const pinned = Boolean(updates.pinned);
      const current = db.announcements[announcementId];
      const next = {
        ...current,
        pinned,
        pinnedAt: pinned ? Number(current.pinnedAt || now) : 0,
        updatedAt: now,
      };
      db.announcements[announcementId] = next;
      return { ...next };
    });
  }

  async getPlatformSettings() {
    return this.readOnly((db) => ({ ...(db.settings.platform || {}) }));
  }

  async updatePlatformSettings(settings = {}) {
    return this.mutate((db) => {
      const existing = db.settings.platform || {};
      const incomingApiKey = String(settings.apiKey || "").trim();
      const next = {
        ...existing,
        textEndpoint: String(settings.textEndpoint || "").trim(),
        editEndpoint: String(settings.editEndpoint || "").trim(),
        apiKey: incomingApiKey || existing.apiKey || "",
        priceCents: Math.max(1, Math.round(Number(settings.priceCents || 10))),
        upstreamCostCents: Math.max(0, Math.round(Number(settings.upstreamCostCents || 0))),
        updatedAt: Date.now(),
      };
      db.settings.platform = next;
      return { ...next };
    });
  }

  async createOrder(customerId, payload) {
    const amountCents = Number(payload.amountCents || 0);
    const paymentMethod = String(payload.paymentMethod || "");
    const note = String(payload.note || "").trim();

    return this.mutate((db) => {
      const customer = ensureCustomerRecord(db, customerId);
      const now = Date.now();
      const id = makeId("ord");
      const order = {
        id,
        customerId,
        amountCents,
        paymentMethod,
        note,
        paymentReference: "",
        status: "pending",
        createdAt: now,
        updatedAt: now,
        submittedAt: 0,
        reviewedAt: 0,
        paidAt: 0,
        reviewNote: "",
      };
      db.orders[id] = order;
      customer.updatedAt = now;
      return { ...order };
    });
  }

  async submitOrder(customerId, payload) {
    const orderId = String(payload.orderId || "");
    const paymentReference = String(payload.paymentReference || "").trim().slice(0, 120);
    const note = String(payload.note || "").trim().slice(0, 200);

    return this.mutate((db) => {
      const order = db.orders[orderId];
      if (!order || order.customerId !== customerId) throw new Error("订单不存在");
      if (order.status === "paid") return { ...order };
      if (order.status === "rejected") throw new Error("该订单已被驳回，请重新创建充值订单");
      const now = Date.now();
      order.status = "submitted";
      order.paymentReference = paymentReference;
      order.note = note || order.note || "";
      order.submittedAt = now;
      order.updatedAt = now;
      return { ...order };
    });
  }

  async listPendingOrders(limit = 30) {
    return this.readOnly((db) =>
      Object.values(db.orders)
        .filter((order) => order.status === "submitted")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit)
        .map((order) => ({
          ...order,
          customer: {
            id: order.customerId,
            balanceCents: db.customers[order.customerId]?.balanceCents || 0,
          },
        })),
    );
  }

  async approveOrder(orderId, reviewNote = "") {
    return this.mutate((db) => {
      const order = db.orders[orderId];
      if (!order) throw new Error("订单不存在");
      if (order.status === "paid") return cloneApprovalResult(order, db.customers[order.customerId]);
      if (order.status !== "submitted" && order.status !== "pending") {
        throw new Error("该订单当前不能审核通过");
      }
      const customer = ensureCustomerRecord(db, order.customerId);
      const now = Date.now();
      order.status = "paid";
      order.reviewNote = String(reviewNote || "").trim().slice(0, 200);
      order.reviewedAt = now;
      order.paidAt = now;
      order.updatedAt = now;
      customer.balanceCents += Number(order.amountCents || 0);
      customer.totalRechargedCents += Number(order.amountCents || 0);
      customer.updatedAt = now;
      return cloneApprovalResult(order, customer);
    });
  }

  async rejectOrder(orderId, reviewNote = "") {
    return this.mutate((db) => {
      const order = db.orders[orderId];
      if (!order) throw new Error("订单不存在");
      if (order.status === "paid") throw new Error("已到账订单不能驳回");
      const now = Date.now();
      order.status = "rejected";
      order.reviewNote = String(reviewNote || "").trim().slice(0, 200);
      order.reviewedAt = now;
      order.updatedAt = now;
      return { ...order };
    });
  }

  async hasEnoughBalance(customerId, requiredCents) {
    return this.readOnly((db) => ensureCustomerRecord(db, customerId).balanceCents >= requiredCents);
  }

  async recordUsage(customerId, payload) {
    const imageCount = Math.max(0, Number(payload.imageCount || 0));
    const amountCents = Math.max(0, Number(payload.amountCents || 0));
    return this.mutate((db) => {
      const customer = ensureCustomerRecord(db, customerId);
      const requestId = String(payload.requestId || "").trim().slice(0, 160);
      if (requestId) {
        const existing = Object.values(db.usage).find((item) => item.customerId === customerId && item.requestId === requestId);
        if (existing) return { usage: { ...existing }, customer: { ...customer } };
      }
      if (customer.balanceCents < amountCents) throw new Error("余额不足");
      const now = Date.now();
      const id = makeId("use");
      const usage = {
        id,
        customerId,
        amountCents,
        imageCount,
        mode: String(payload.mode || "text"),
        model: String(payload.model || ""),
        endpoint: String(payload.endpoint || ""),
        requestId,
        createdAt: now,
      };
      db.usage[id] = usage;
      customer.balanceCents -= amountCents;
      customer.totalSpentCents += amountCents;
      customer.updatedAt = now;
      return {
        usage: { ...usage },
        customer: { ...customer },
      };
    });
  }
}

function normalizeDb(value) {
  return {
    customers: isRecord(value?.customers) ? value.customers : {},
    sessions: isRecord(value?.sessions) ? value.sessions : {},
    orders: isRecord(value?.orders) ? value.orders : {},
    usage: isRecord(value?.usage) ? value.usage : {},
    redeemCodes: isRecord(value?.redeemCodes) ? value.redeemCodes : {},
    redemptions: isRecord(value?.redemptions) ? value.redemptions : {},
    settings: isRecord(value?.settings) ? value.settings : {},
    announcements: normalizeAnnouncements(value?.announcements),
    siteStats: normalizeSiteStats(value?.siteStats),
  };
}

async function replaceFileWithRetry(tempPath, targetPath) {
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      try {
        await fs.unlink(targetPath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      await fs.rename(tempPath, targetPath);
      return;
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EBUSY", "EACCES"].includes(error?.code)) throw error;
      await delay(50 * (attempt + 1));
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRedeemCode(code) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^\w-]/g, "");
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || email.length > 254) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function hashContactEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "";
  return crypto.createHash("sha256").update(`api2image:contact-email:v1:${normalized}`).digest("hex");
}

function maskEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return "";
  const [name, domain] = normalized.split("@");
  const safeName = name.length <= 2 ? `${name[0] || "*"}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${safeName}@${domain}`;
}

function ensureCustomerRecord(db, customerId) {
  const customer = db.customers[customerId];
  if (!customer) throw new Error("用户不存在");
  customer.balanceCents = Number(customer.balanceCents || 0);
  customer.totalSpentCents = Number(customer.totalSpentCents || 0);
  customer.totalRechargedCents = Number(customer.totalRechargedCents || 0);
  customer.createdAt = Number(customer.createdAt || Date.now());
  customer.updatedAt = Number(customer.updatedAt || customer.createdAt);
  return customer;
}

function valuesByCustomer(record, customerId) {
  return Object.values(record)
    .filter((item) => item.customerId === customerId)
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0))
    .map((item) => ({ ...item }));
}

function normalizeSiteStats(value) {
  const dailyVisits = isRecord(value?.dailyVisits) ? value.dailyVisits : {};
  return {
    totalVisits: Math.max(0, Number(value?.totalVisits || 0)),
    totalVisitors: Math.max(0, Number(value?.totalVisitors || 0)),
    dailyVisits: Object.fromEntries(
      Object.entries(dailyVisits).map(([key, count]) => [key, Math.max(0, Number(count || 0))]),
    ),
    lastVisitAt: Math.max(0, Number(value?.lastVisitAt || 0)),
    updatedAt: Math.max(0, Number(value?.updatedAt || 0)),
  };
}

function normalizeAnnouncements(value) {
  if (isRecord(value) && !Object.keys(value).length) return {};
  const records = isRecord(value)
    ? Object.values(value)
    : Array.isArray(value)
      ? value
      : [];
  const announcements = {};
  for (const item of records) {
    const record = normalizeAnnouncementRecord(item);
    if (!record.id) continue;
    announcements[record.id] = record;
  }
  if (!Object.keys(announcements).length) {
    announcements[DEFAULT_DB.announcements.ann_welcome.id] = { ...DEFAULT_DB.announcements.ann_welcome };
  }
  return announcements;
}

function normalizeAnnouncementRecord(value) {
  const body = String(value?.body || value?.content || value?.text || "").trim().slice(0, 4000);
  if (!body) return { id: "", title: "", body: "", pinned: false, createdAt: 0, updatedAt: 0 };
  return {
    id: String(value?.id || "").trim() || makeId("ann"),
    title: String(value?.title || "").trim().slice(0, 120) || deriveAnnouncementTitle(body),
    body,
    pinned: Boolean(value?.pinned),
    pinnedAt: Math.max(0, Number(value?.pinnedAt || (value?.pinned ? value?.updatedAt || value?.createdAt || 0 : 0))),
    createdAt: Math.max(0, Number(value?.createdAt || 0)),
    updatedAt: Math.max(0, Number(value?.updatedAt || value?.createdAt || 0)),
  };
}

function deriveAnnouncementTitle(body) {
  const firstLine = String(body || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return (firstLine || "站点公告").slice(0, 24);
}

function getDateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function cloneApprovalResult(order, customer) {
  return {
    order: { ...order },
    customer: { ...customer },
  };
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function makeId(prefix) {
  const body = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${body}`;
}

module.exports = {
  BillingStore,
};
