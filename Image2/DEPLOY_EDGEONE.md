# API 2 Image 免费部署到 EdgeOne Pages

这个项目已经加好了 EdgeOne Pages 的云函数代理，线上仍然可以使用页面里的“代理”传输方式。

## 推荐方式：Git 导入部署

1. 在 GitHub、Gitee 或 CODING 新建一个私有仓库。
2. 把整个项目目录上传到仓库，至少包含这些文件：
   - `index.html`
   - `app.js`
   - `styles.css`
   - `cloud-functions/api/proxy-image.js`
   - `cloud-functions/api/cache-image.js`
   - `cloud-functions/package.json`
   - `package.json`
3. 打开 EdgeOne Pages 控制台，创建项目，选择“导入 Git 仓库”。
4. 构建设置建议如下：
   - Framework preset：Other / Static Site
   - Build command：留空
   - Output directory：`.`
5. 部署完成后打开 EdgeOne 给你的访问域名。
6. 进入网页右上角“API 设置”，传输方式保持“代理”，填入你的中转站 API URL 和 API Key。

## 备用方式：上传构建输出

如果你不想接 Git 仓库，也可以先在本地运行：

```bash
node scripts/build-edgeone.mjs
```

然后把生成的 `.edgeone` 目录作为构建输出上传。这个方式更适合手动上传，但后续每次修改都要重新打包再上传。

## API URL 建议

文生图 API URL：

```text
https://你的中转站域名/v1/images/generations
```

图生图 / 编辑 API URL：

```text
https://你的中转站域名/v1/images/edits
```

如果你只填文生图 URL，网页会在图生图时自动从 `/generations` 推导到 `/edits`。

## 国内访问

EdgeOne Pages 本身更偏国内友好。部署时如果有“加速区域”选项，优先选择包含中国大陆或全球加速的选项。默认的 `*.edgeone.app` 域名通常可以直接测试；如果你有自己的域名，再按 EdgeOne 提示添加 CNAME 和 HTTPS 证书。

## 注意事项

- 不要把 API Key 写死进代码里，继续在网页设置里填写即可。
- 免费额度一般够个人使用，但云函数代理会消耗 EdgeOne 的函数/流量额度，图片越大越容易用得快。
- 如果上线后生成失败，先点“生成日志”，确认请求地址是不是同域的 `/api/proxy-image`，以及日志里的最终 API URL 是否正确。
- 如果 EdgeOne 函数报体积或超时限制，优先降低单次生成数量，或者改用“浏览器直连”测试是不是代理限制导致。

## 本地命令

本地启动：

```bash
node server.js
```

生成 EdgeOne 构建输出：

```bash
node scripts/build-edgeone.mjs
```

输出目录：

```text
.edgeone/
```
