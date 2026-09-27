// Generate docs/ads.md (copy deck for review) and ads/ads-sheet.csv (one row per ad, for building
// the ads in Ads Manager by hand or handing to someone who will). Source of truth: ads/ads.json.
// Usage: npm run build:docs
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url).pathname;
const data = JSON.parse(await readFile(`${root}ads/ads.json`, 'utf8'));

const CTA_LABEL = { LEARN_MORE: 'Learn more', SIGN_UP: 'Sign up', BOOK_NOW: 'Book now' };

let md = `# Ad copy deck: ${data.campaign}

Generated from \`ads/ads.json\` by \`npm run build:docs\`. Edit the JSON, not this file.

Every ad uses the same URL parameters (paste into the ad's **URL parameters** field):

\`\`\`
${data.urlParameters}
\`\`\`

`;

for (const cell of data.cells) {
  md += `## ${cell.id}: ${cell.angle}\n\n`;
  md += `- **Ad set:** \`${cell.adset}\`\n- **Audience:** ${cell.audience}\n- **Landing page:** ${cell.url}\n- **Lead magnet:** ${cell.leadMagnet}\n- **Hypothesis:** ${cell.hypothesis}\n\n`;
  for (const ad of data.ads.filter((a) => a.cell === cell.id)) {
    md += `### \`${ad.id}\`\n\n`;
    md += `| Feed 4:5 | Story 9:16 |\n|---|---|\n| <img src="../ads/out/${ad.id}_feed.png" width="220"> | <img src="../ads/out/${ad.id}_story.png" width="160"> |\n\n`;
    md += `**Primary text**\n\n${ad.primaryText.split('\n').map((l) => `> ${l}`).join('\n')}\n\n`;
    md += `**Headline:** ${ad.headline}  \n**Description:** ${ad.description}  \n**Button:** ${CTA_LABEL[ad.cta] || ad.cta}\n\n`;
  }
}

await writeFile(`${root}docs/ads.md`, md);

const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;
const header = ['Campaign', 'Ad set', 'Ad name', 'Primary text', 'Headline', 'Description', 'Call to action', 'Website URL', 'URL parameters', 'Feed image', 'Story image'];
const rows = data.ads.map((ad) => {
  const cell = data.cells.find((c) => c.id === ad.cell);
  return [data.campaign, cell.adset, ad.id, ad.primaryText, ad.headline, ad.description, CTA_LABEL[ad.cta] || ad.cta, cell.url, data.urlParameters, `ads/out/${ad.id}_feed.png`, `ads/out/${ad.id}_story.png`];
});
await writeFile(`${root}ads/ads-sheet.csv`, `${[header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')}\n`);
console.log(`Wrote docs/ads.md and ads/ads-sheet.csv (${rows.length} ads)`);
