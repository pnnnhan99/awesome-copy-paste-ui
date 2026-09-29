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

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const lastUpdate = formatter.format(new Date());

  let md = `# 🎨 Awesome Copy-Paste UI\n\n`;
  md += `[![Total Libraries](https://img.shields.io/badge/Total_Libraries-${libs.length}-blue)]()\n`;
  md += `[![Active Links](https://img.shields.io/badge/Active_Links-${activeCount}-green)]()\n`;
  md += `[![Auto Update](https://img.shields.io/badge/Auto_Update-Daily-purple)]()\n\n`;

  md += `> 🕒 **Last auto update:** ${lastUpdate}\n\n`;

  md += `✨ A treasure trove of ultra-smooth UI Components following the 'Copy & Paste' standard. No heavy npm install needed - if it looks good, copy and paste it directly into your project! Helps Vibe Coders build Landing Pages and Web Apps in no time.\n\n`;
  md += `---\n\n`;

  for (const [category, items] of Object.entries(categories)) {
    md += `## 📦 ${category}\n\n`;
    md += `| Library Name | Short Description | Core Technology (Styling) | Web Status |\n`;
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