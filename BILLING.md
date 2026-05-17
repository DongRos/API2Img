# 充值功能使用说明

## 本地配置

复制 `.env.example` 为 `.env`，至少填写这些：

```env
PLATFORM_TEXT_ENDPOINT=https://你的上游/v1/images/generations
PLATFORM_EDIT_ENDPOINT=https://你的上游/v1/images/edits
PLATFORM_API_KEY=sk-你的上游key
BILLING_ADMIN_PASSWORD=换成你自己的管理密码
```

价格默认是 `1毛/张`：

```env
PLATFORM_PRICE_CENTS=10
PLATFORM_UPSTREAM_COST_CENTS=4
```

## 收款码

把你的收款码图片放到：

```text
payments/wechat.png
payments/alipay.png
```

然后在 `.env` 填：

```env
PAYMENT_WECHAT_QR_URL=/payments/wechat.png
PAYMENT_ALIPAY_QR_URL=/payments/alipay.png
```

## 用户怎么充值

用户打开网页右上角“余额”，选择金额和微信/支付宝，付款后提交付款备注或流水号。

## 最低成本方案：兑换码充值

这套方式不需要你的网站接微信/支付宝回调。你先生成一批兑换码，把兑换码作为“卡密库存”导入发卡网。用户付款后，发卡网自动把兑换码发给用户；用户回到你的网站输入兑换码，余额自动到账。

生成 10 个 5 元兑换码：

```powershell
$env:BILLING_ADMIN_PASSWORD="你的管理密码"
node scripts/billing-admin.js codes:generate 5 10 5元充值码
```

生成 20 个 10 元兑换码：

```powershell
node scripts/billing-admin.js codes:generate 10 20 10元充值码
```

脚本会生成一个 CSV 文件，例如：

```text
redeem-codes-5yuan-xxxxxxxx.csv
```

把 CSV 里的 `code` 列导入发卡网商品库存即可。每个兑换码只能使用一次，兑换成功后会自动作废。

也可以直接在网页里生成：打开网站后在地址后加 `?admin=1`，例如 `http://127.0.0.1:4173/?admin=1`。隐藏面板里填写 `BILLING_ADMIN_PASSWORD`、金额、数量和标签，点击“生成并下载 CSV”即可。页面会自动把兑换码写入数据库，并下载可导入发卡网的 CSV。

另一个隐藏打开方式：在网页任意位置连续输入 `codeadmin`。

查看最近生成/使用的兑换码：

```powershell
node scripts/billing-admin.js codes:list
```

## 你怎么确认到账

先启动服务：

```bash
node server.js
```

设置管理密码后查看待审核订单：

```powershell
$env:BILLING_ADMIN_PASSWORD="你的管理密码"
node scripts/billing-admin.js list
```

审核通过：

```powershell
node scripts/billing-admin.js approve ord_xxxxx 已收款
```

驳回：

```powershell
node scripts/billing-admin.js reject ord_xxxxx 未收到款
```

## 扣费逻辑

用户选择“推荐 API · 1毛/张”时，请求会走 `/api/billing/platform-image`。服务端先检查余额，余额足够才调用你配置的推荐 API 上游；上游返回图片后，按实际返回图片数扣费。

用户选择“自定义 API”时仍然走原来的配置，不扣你的余额。

## 上线提醒

当前版本是“收款码付款 + 你人工审核到账”。这适合个人快速上线，不需要微信/支付宝商户号。

如果你使用兑换码充值，网站这边只需要兑换码接口，不需要收款码，也不需要支付回调。发卡网负责收钱和发码。

EdgeOne Pages 上线时，还需要：

1. 在项目里创建 Blob 存储，默认名称用 `api2image-billing`。
2. 在 EdgeOne Pages 的环境变量里填写 `.env.example` 里的配置。
3. 上传 `payments/wechat.png` 和 `payments/alipay.png`，或把二维码图片放到其它可访问 URL，再填到 `PAYMENT_WECHAT_QR_URL` / `PAYMENT_ALIPAY_QR_URL`。

如果后面要全自动到账，需要申请微信支付或支付宝商户，增加支付下单、异步回调验签和订单自动入账；不要把商户私钥放到前端。
