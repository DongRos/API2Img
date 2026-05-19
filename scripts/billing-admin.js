#!/usr/bin/env node
const http = require("http");
const https = require("https");
const fs = require("fs/promises");

const [, , command, ...args] = process.argv;
const baseUrl = process.env.BILLING_BASE_URL || "https://api2image.top";
const adminPassword = process.env.BILLING_ADMIN_PASSWORD || "";

if (!adminPassword) {
  console.error("Please set BILLING_ADMIN_PASSWORD first.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

async function main() {
  if (command === "codes:list") {
    const payload = await request("GET", "/api/admin/redeem-codes");
    if (!payload.codes?.length) {
      console.log("No redeem codes yet.");
      return;
    }
    payload.codes.forEach((item) => {
      console.log(
        [
          item.code,
          `amount:${money(item.amountCents)} yuan`,
          `status:${item.status}`,
          `label:${item.label || "-"}`,
          item.usedByUserId ? `usedBy:${item.usedByUserId}` : "",
        ]
          .filter(Boolean)
          .join("  "),
      );
    });
    return;
  }

  if (command === "codes:generate") {
    const amountYuan = Number(args[0] || 0);
    const count = Math.max(1, Math.min(1000, Math.floor(Number(args[1] || 0))));
    const label = args[2] || `${amountYuan} yuan redeem code`;
    if (!amountYuan || !count) {
      throw new Error("Usage: node scripts/billing-admin.js codes:generate <amount-yuan> <count> [label]");
    }
    const payload = await request("POST", "/api/admin/redeem-codes", {
      amountCents: Math.round(amountYuan * 100),
      count,
      label,
    });
    const filename = `redeem-codes-${amountYuan}yuan-${Date.now()}.csv`;
    await fs.writeFile(
      filename,
      ["code,amount_yuan,label", ...payload.codes.map((item) => `${item.code},${money(item.amountCents)},${csvCell(item.label)}`)].join("\n"),
      "utf8",
    );
    console.log(`Created ${payload.codes.length} redeem codes: ${filename}`);
    console.log("Import the CSV code column into your card-selling platform.");
    return;
  }

  console.log("Usage:");
  console.log("  node scripts/billing-admin.js codes:list");
  console.log("  node scripts/billing-admin.js codes:generate <amount-yuan> <count> [label]");
}

function request(method, pathname, body) {
  const url = new URL(pathname, baseUrl);
  const data = body ? JSON.stringify(body) : "";
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(
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

function csvCell(value) {
  const text = String(value || "");
  return /[,"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function money(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}
