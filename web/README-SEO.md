# Movement Lab SEO 配置

已完成：中文标题与摘要、独立动作网址、可直接读取的 HTML 文字内容、站内链接、结构化数据、分享元信息、图片延迟加载及尺寸声明。动作演示仍使用 Three.js，旧的 `?exercise=...` 网址可继续使用，浏览器会切到独立网址。

## 当前状态

正式域名尚未确定。未配置 `SITE_URL` 的构建默认使用 `noindex,follow`，robots.txt 禁止抓取，不输出带占位域名的 sitemap 或 canonical。localhost 本身也不是可供公开搜索收录的网站。

## 正式上线

在 `web/.env.production` 中设置实际部署地址，例如：

```dotenv
SITE_URL=https://your-real-domain.com/
```

这里的域名只是格式示例，请替换成真实域名。若部署到子目录，应填写完整根路径，例如 `https://your-real-domain.com/fitness/`，结尾保留 `/`。不需要在变量名前加 VITE_。

```bash
npm run build
npm run check:seo
```

配置后会生成：

- 首页：`dist/index.html`
- 各个动作页：`dist/exercises/<id>/index.html`
- 解剖图谱页：`dist/anatomy/index.html`
- 未找到页面：`dist/404.html`
- `dist/sitemap.xml`：首页、所有动作页及图谱的规范网址，不包含预览或查询变体。
- `dist/robots.txt`：允许抓取，并声明 sitemap 地址。

将整个 dist 文件夹部署到上述地址。静态托管应直接提供生成的 HTML 文件，不要把所有请求统一重写成首页；未知路径应使用 404.html 并返回 HTTP 404。具体规则取决于最终选择的托管服务。

若使用子目录部署，网站根域名的 robots.txt 仍需能让搜索引擎访问，并在其中声明子目录的 sitemap。子目录里的 robots.txt 不会取代域名根目录的 robots.txt。

## 验证与限制

使用 `npm run preview` 检查构建结果。确认独立动作页可直接打开、刷新正常、标题与内容相符、资源加载成功。上线后再通过真实域名验证 canonical、robots、sitemap，并向搜索站长平台提交 sitemap。

旧查询网址使用浏览器内的 URL 规范化，未伪称服务器已经配置 HTTP 301；若需永久重定向，须在最终托管服务上设置。预览网址使用 noindex；canonical 指向对应的正常动作页。

结构化数据描述真实内容，没有添加虚构评分、作者资历、运动效果承诺或并不存在的视频。它不保证搜索引擎提供富媒体结果或排名提升。

参考：[Google JavaScript SEO 基础](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)、[开发者搜索指南](https://developers.google.com/search/docs/fundamentals/get-started-developers)。
