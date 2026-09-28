import fs from 'fs';
import fetch from 'node-fetch';

const DATA_PATH = new URL('../data/ui-libs.json', import.meta.url);
const README_PATH = new URL('../README.md', import.meta.url);

const TIMEOUT = 8000;

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    if (response.status === 403) return '🟢';
    if (response.ok) return '🟢';
    return '🔴';
  } catch {
    return '🔴';
  }
}

function groupByCategory(libs) {
  return libs.reduce((acc, lib) => {
    if (!acc[lib.category]) acc[lib.category] = [];
    acc[lib.category].push(lib);
    return acc;
  }, {});
}

async function buildReadme() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const libs = JSON.parse(raw);

  const statuses = await Promise.all(libs.map(async (lib) => {
    const status = await checkUrl(lib.url);
    return { ...lib, status };
  }));

  const activeCount = statuses.filter((l) => l.status === '🟢').length;
  const categories = groupByCategory(statuses);

  let md = `# 🎨 Awesome Copy-Paste UI

[![Total Libraries](https://img.shields.io/badge/Total_Libraries-${libs.length}-blue)]()
[![Active Links](https://img.shields.io/badge/Active_Links-${activeCount}-green)]()
[![Auto Update](https://img.shields.io/badge/Auto_Update-Daily-purple)]()

✨ Kho báu UI Components cực mượt theo chuẩn 'Copy & Paste'. Không cần npm install nặng nề, thấy đẹp là copy dán ngay vào project! Giúp Vibe Coder dựng Landing Page và Web App trong tích tắc.

---

`;

  for (const [category, items] of Object.entries(categories)) {
    md += `## 📦 ${category}\n\n`;
    md += `| Tên Thư viện | Mô tả ngắn | Công nghệ lõi (Styling) | Trạng thái web |\n`;
    md += `|---|---|---|---|\n`;
    for (const lib of items) {
      md += `| [${lib.name}](${lib.url}) | ${lib.description} | ${lib.styling} | ${lib.status} |\n`;
    }
    md += '\n';
  }

  fs.writeFileSync(README_PATH, md);
  console.log(`✅ README.md generated. ${activeCount}/${libs.length} links active.`);
}

buildReadme().catch((err) => {
  console.error('Error building README:', err);
  process.exit(1);
});
