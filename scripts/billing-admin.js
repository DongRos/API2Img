#!/usr/bin/env node
const http = require("http");
const fs = require("fs/promises");
const crypto = require("crypto");

const [, , command, ...args] = process.argv;
const baseUrl = process.env.BILLING_BASE_URL || "http://127.0.0.1:4173";
const adminPassword = process.env.BILLING_ADMIN_PASSWORD || "";

if (!adminPassword) {
  console.error("请先设置 BILLING_ADMIN_PASSWORD 环境变量");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

async function main() {
  if (command === "codes:list") {
    const payload = await request("GET", "/api/billing/admin/codes");
    if (!payload.codes?.length) {
      console.log("还没有兑换码");
      return;
    }
    payload.codes.forEach((item) => {
      console.log(
        [
          item.code,
          `金额:${money(item.amountCents)}元`,
          `状态:${item.status}`,
          `标签:${item.label || "-"}`,
          item.usedBy ? `使用用户:${item.usedBy}` : "",
        ]
          .filter(Boolean)
          .join("  "),
      );
    });
    return;
  }

  if (command === "codes:generate") {
    const amountYuan = Number(args[0] || 0);
    const count = Math.max(1, Math.min(1000, Number(args[1] || 0)));
    const label = args[2] || `${amountYuan}元充值码`;
    if (!amountYuan || !count) {
      throw new Error("用法: node scripts/billing-admin.js codes:generate <金额元> <数量> [标签]");
    }
    const codes = Array.from({ length: count }, () => ({
      code: makeRedeemCode(),
      amountCents: Math.round(amountYuan * 100),
      label,
    }));
    const payload = await request("POST", "/api/billing/admin/codes", { codes });
    const filename = `redeem-codes-${amountYuan}yuan-${Date.now()}.csv`;
    await fs.writeFile(
      filename,
      ["code,amount_yuan,label", ...payload.codes.map((item) => `${item.code},${money(item.amountCents)},${csvCell(item.label)}`)].join("\n"),
      "utf8",
    );
    console.log(`已生成 ${payload.codes.length} 个兑换码: ${filename}`);
    console.log("把 CSV 里的 code 列导入发卡网作为卡密库存即可。");
    return;
  }

  console.log("用法:");
  console.log("  node scripts/billing-admin.js codes:list");
  console.log("  node scripts/billing-admin.js codes:generate <金额元> <数量> [标签]");
}

function request(method, pathname, body) {
  const url = new URL(pathname, baseUrl);
  const data = body ? JSON.stringify(body) : "";
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "X-Admin-Password": adminPassword,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let payload = {};
          try {
            payload = text ? JSON.parse(text) : {};
          } catch {
            payload = { error: { message: text } };
          }
          if (res.statusCode >= 400) {
            reject(new Error(payload.error?.message || `HTTP ${res.statusCode}`));
            return;
          }
          resolve(payload);
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function makeRedeemCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = [];
  for (const byte of crypto.randomBytes(16)) chars.push(alphabet[byte % alphabet.length]);
  return `A2I-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}`;
}

function csvCell(value) {
  const text = String(value || "");
  return /[,"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function money(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}
