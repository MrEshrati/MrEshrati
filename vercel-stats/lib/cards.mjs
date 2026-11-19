const formatNumber = new Intl.NumberFormat('en-US');
const formatShare = new Intl.NumberFormat('en-US', {
  style: 'percent', maximumFractionDigits: 1,
});

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[char]);
}

function card(title, caption, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="194" viewBox="0 0 330 194" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <style>
    .panel { fill: #f0f9f7; stroke: #c6e1dc; }
    .title, .metric { fill: #166451; font-weight: 600; }
    .text { fill: #203b37; }
    .muted { fill: #48615a; }
    .line { stroke: #c6e1dc; }
    @media (prefers-color-scheme: dark) {
      .panel { fill: #112030; stroke: #315560; }
      .title, .metric { fill: #77eacb; }
      .text { fill: #e6f5f2; }
      .muted { fill: #a8c0c4; }
      .line { stroke: #315560; }
    }
  </style>
  <rect class="panel" x=".5" y=".5" width="329" height="193" rx="10"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text class="title" x="16" y="30" font-size="16">${escapeXml(title)}</text>
    <text class="muted" x="16" y="49" font-size="12">${escapeXml(caption)}</text>
${body}
  </g>
</svg>`;
}

const formatCompactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact', maximumFractionDigits: 1,
});

const ACTIVITY_GRADES = [
  [0.7, 'A+'],
  [0.6, 'A'],
  [0.5, 'A−'],
  [0.4, 'B+'],
  [0.3, 'B'],
  [0.2, 'B−'],
  [0.1, 'C'],
  [0, 'D'],
];

export function activityCard({ total, commits, pullRequests, issues, totalDays, activeDays, longestStreak }) {
  const share = totalDays > 0 ? activeDays / totalDays : 0;
  const grade = totalDays > 0 ? ACTIVITY_GRADES.find(([minimum]) => share >= minimum)[1] : '—';
  const metrics = [
    { label: 'Contributions', value: total, icon: '<path d="M1.5 8h3l1.8-4.2 3.1 8 1.8-3.8h3.3"/>' },
    { label: 'Commits', value: commits, icon: '<circle cx="8" cy="8" r="3"/><path d="M1 8h4m6 0h4"/>' },
    { label: 'Pull requests', value: pullRequests, icon: '<circle cx="4" cy="3" r="1.5"/><circle cx="4" cy="13" r="1.5"/><circle cx="12" cy="13" r="1.5"/><path d="M4 4.5v7m8 0v-4a3 3 0 0 0-3-3H8m1.5-1.5L8 4.5 9.5 6"/>' },
    { label: 'Issues opened', value: issues, icon: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8v3.6m0 2.7v.1"/>' },
    { label: 'Longest streak', value: longestStreak, unit: ' days', icon: '<path d="m9 1.5-5.3 7H8l-1 6 5.3-7H8z"/>' },
  ];

  const rows = metrics.map(({ label, value, unit = '', icon }, index) => {
    const baseline = 77 + 22 * index;
    const display = value < 100_000 ? formatNumber.format(value) : formatCompactNumber.format(value);
    return `    <g class="activity-stroke" transform="translate(17 ${baseline - 12})" fill="none" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
    <text class="text" x="41" y="${baseline}" font-size="13">${label}</text>
    <text class="text" x="197" y="${baseline}" text-anchor="end" font-size="13" font-weight="600">${display}${unit}</text>`;
  });
  const progress = share > 0 ? `
    <circle class="activity-stroke" cx="260" cy="116" r="39" pathLength="100" transform="rotate(-90 260 116)" fill="none" stroke-width="5" stroke-dasharray="${(share * 100).toFixed(3)} 100" stroke-linecap="round"/>` : '';
  const description = metrics.map(({ label, value, unit = '' }) => `${label}: ${formatNumber.format(value)}${unit}`).join('. ');

  return card('GitHub Stats', 'Last 12 months', `${description}. Activity grade ${grade}. Active on ${activeDays} of ${totalDays} days.`, `
    <style>
      .activity-stroke { stroke: #166451; }
      @media (prefers-color-scheme: dark) { .activity-stroke { stroke: #77eacb; } }
    </style>
${rows.join('\n')}
    <circle class="line" cx="260" cy="116" r="39" fill="none" stroke-width="5"/>${progress}
    <text class="metric" x="260" y="119" text-anchor="middle" font-size="26">${grade}</text>
    <text class="muted" x="260" y="135" text-anchor="middle" font-size="10">Activity grade</text>`);
}

const COLORS = ['#269785', '#597bb8', '#9170b8', '#b7793d', '#307fa3', '#75838d'];

export function languagesCard(totals) {
  const caption = 'By code size in owned repositories';
  if (!totals.length) return card('Most Used Languages', caption, 'No language data yet.', `
    <text class="text" x="16" y="105" font-size="14">No language data yet</text>`);

  const sum = totals.reduce((total, [, bytes]) => total + bytes, 0);
  const entries = totals.slice(0, 5);
  if (totals.length > 5) entries.push(['Other', sum - entries.reduce((total, [, bytes]) => total + bytes, 0)]);

  let offset = 16;
  const slices = [];
  const labels = [];
  const description = [];
  for (const [index, [name, bytes]] of entries.entries()) {
    const share = bytes / sum;
    const width = share * 298;
    const color = COLORS[index];
    slices.push(`    <rect x="${offset.toFixed(3)}" y="66" width="${width.toFixed(3)}" height="8" fill="${color}"/>`);
    offset += width;

    const label = name.length > 27 ? `${name.slice(0, 26)}…` : name;
    const y = 96 + index * 16;
    const percent = formatShare.format(share);
    description.push(`${name} ${percent}`);
    labels.push(`    <circle cx="20" cy="${y - 4}" r="3.5" fill="${color}"/>
    <text class="text" x="30" y="${y}" font-size="12">${escapeXml(label)}</text>
    <text class="muted" x="314" y="${y}" text-anchor="end" font-size="12">${percent}</text>`);
  }
  return card('Most Used Languages', caption, description.join(', '), `
    <clipPath id="bar"><rect x="16" y="66" width="298" height="8" rx="4"/></clipPath>
    <g clip-path="url(#bar)">
${slices.join('\n')}
    </g>
${labels.join('\n')}`);
}
