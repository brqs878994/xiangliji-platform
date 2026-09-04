import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '..', 'dist', 'index.html');
const favicon = resolve(here, '..', 'src', 'assets', 'favicon.svg');
const faviconOutput = resolve(here, '..', 'dist', 'favicon.svg');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>乡里集</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/css/app.css">
  <link rel="stylesheet" href="/css/926.css">
</head>
<body>
  <div id="app"></div>
  <script src="/js/838.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>
`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, html, 'utf8');
await copyFile(favicon, faviconOutput);
console.log(`H5 entry written: ${output}`);
