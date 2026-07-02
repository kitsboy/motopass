import { readFileSync, writeFileSync } from 'node:fs'

const path = 'website/index.html'
let html = readFileSync(path, 'utf8')

const loader = `// ── DATA (loaded from research/countries.json) ──
let programs = [];

function jsonToDemoProgram(p) {
  const score = p.finance?.crypto_friendly_score ?? 5;
  const statusType = score >= 9 ? 'btc' : score >= 7 ? 'green' : 'gold';
  const hash = (p.satohash_proofs?.[0]?.proof_url || '').split('/').pop() || ('a'.repeat(64));
  return {
    id: p.id, name: p.name, flag: p.flag || '🌍', region: p.region,
    status: p.status.split(' - ')[0], statusType, score,
    details: p.details,
    facts: { residency: p.finance.processing_time_months + ' mo', path: p.category, tax: p.finance.tax_benefits?.slice(0,20), btc: p.finance.bitcoin_specific?.slice(0,20), dual: 'Verify' },
    checks: [{y:true,t:p.bitcoin_integration?.slice(0,80)},{y:score>=7,t:'Crypto score ' + score + '/10'},{y:!!p.lightning_ready,t:'Lightning ready'}],
    btcBars: [{l:'Regulatory',v:score*10},{l:'BTC Banking',v:score*9},{l:'Tax',v:(p.sovereignty_score||5)*10},{l:'Stability',v:score*8}],
    hash, block: String(p.last_verified_block || 897441).replace(/(\\d)(?=(\\d{3})+$)/g,'$1,'), confs: '6'
  };
}

async function loadPrograms() {
  try {
    const res = await fetch('../research/countries.json');
    const data = await res.json();
    programs = (data.programs || []).map(jsonToDemoProgram);
    document.getElementById('programs-grid').innerHTML = '';
    renderPrograms();
  } catch (e) {
    console.error('Failed to load countries.json', e);
  }
}
`

const start = html.indexOf('// ── DATA ──')
const end = html.indexOf('// ── RENDER PROGRAMS GRID ──')
if (start === -1 || end === -1) throw new Error('markers not found')
html = html.slice(0, start) + loader + '\n' + html.slice(end)

html = html.replace(
  "document.addEventListener('DOMContentLoaded', () => {\n  renderPrograms();",
  "document.addEventListener('DOMContentLoaded', () => {\n  loadPrograms();"
)

writeFileSync(path, html)
console.log('Patched website/index.html to fetch live JSON')