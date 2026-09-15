import { useEffect, useState } from 'react'

/**
 * MotoPass · Source Monitor
 * Watches every official passport/citizenship/immigration source we rely on.
 * Data: /data/source-monitor.json (per-country status + change manifest) and
 * /data/source-events.json (rolling change/coverage history with diffs).
 * Self-contained styles so it renders independently of the app theme.
 */

const COLORS: Record<Status, string> = { ok: '#2ee6a8', blocked: '#ffb648', unreachable: '#ff5c5c' }
const LABELS: Record<Status, string> = { ok: 'healthy', blocked: 'blocked', unreachable: 'unreachable' }

function host(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}
function ago(iso) {
  if (!iso) return '—'
  const s = (Date.now() - new Date(iso).getTime()) / 3600000
  if (s < 1) return `${Math.round(s * 60)}m ago`
  if (s < 24) return `${Math.round(s)}h ago`
  return `${Math.round(s / 24)}d ago`
}
function gapLabel(d) { return d ? `${d}d data gap` : 'live' }

const s = {
  page: { background: '#14070c', color: '#fbeef4', minHeight: '100vh', padding: '22px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' },
  hero: { margin: '38px 0 10px' },
  h1: { fontSize: 'clamp(30px,4.5vw,56px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05, margin: 0 },
  h1accent: { background: 'linear-gradient(90deg,#ff2d7a,#ff7ac0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' },
  p: { color: '#c99aab', fontSize: 15, maxWidth: 720, lineHeight: 1.6, margin: '12px 0 0' },
  honesty: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '20px 0', background: 'rgba(255,45,122,.08)', border: '1px solid rgba(255,45,122,.35)', padding: '12px 16px', borderRadius: 16, fontSize: 13, color: '#ffc4de', fontWeight: 600 },
  live: { width: 10, height: 10, borderRadius: 10, background: COLORS.ok, boxShadow: '0 0 0 5px rgba(46,230,168,.15)' },
  chips: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, margin: '24px 0' },
  chip: { background: '#1e0d15', border: '1px solid #2a1220', borderRadius: 18, padding: '16px 18px' },
  chipN: { fontSize: 34, fontWeight: 800, lineHeight: 1 },
  chipL: { fontSize: 11, color: '#c99aab', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 },
  layout: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 },
  mobile: '@media(max-width:980px){#smLayout{grid-template-columns:1fr}}',
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 14px' },
  fb: { padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: '#c99aab', border: '1px solid #2a1220', background: '#1e0d15', cursor: 'pointer' },
  fbOn: { background: '#a41855', color: '#fff', borderColor: '#a41855' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(215px,1fr))', gap: 12, maxHeight: '74vh', overflow: 'auto', paddingRight: 6 },
  card: { background: '#1e0d15', border: '1px solid #2a1220', borderRadius: 16, padding: 14, cursor: 'pointer', transition: '.15s' },
  rail: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  panel: { background: '#1e0d15', border: '1px solid #2a1220', borderRadius: 18, padding: 18 },
  panelH: { fontSize: 13, textTransform: 'uppercase', letterSpacing: '.1em', color: '#c99aab', margin: '0 0 12px' },
  row: { display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #2a1220', fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 10, flexShrink: 0, marginTop: 4 },
  muted: { color: '#c99aab', fontSize: 11 },
  err: { color: COLORS.unreachable, padding: 40, textAlign: 'center' as const },
}

type Url = { url: string; status: string; last_probed: string | null; coverage_gap_days?: number; last_error?: string | null }
type Country = { program_id: number; name: string; changed: boolean; coverage_gap_days?: number; urls: Url[] }
type Ev = { kind: string; country: string; url: string; status?: string; scopes?: string[]; ts: string; before?: string; after?: string }
/** /data/source-monitor.json (written by scripts/write-intel.mjs). */
type MonitorManifest = { generated_at: string; total_urls: number; by_country?: Country[] }
type Status = 'ok' | 'blocked' | 'unreachable'

export function SourceMonitorPage() {
  const [manifest, setManifest] = useState<MonitorManifest | null>(null)
  const [events, setEvents] = useState<Ev[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const c = new AbortController()
    Promise.all([
      fetch('/data/source-monitor.json', { signal: c.signal }).then(r => r.json()),
      fetch('/data/source-events.json', { signal: c.signal }).then(r => r.json()).catch(() => []),
    ]).then(([m, e]) => { setManifest(m); setEvents(e) }).catch(e => setErr(String(e)))
    return () => c.abort()
  }, [])

  const best = (c: Country): Status => c.urls.some(u => u.status === 'ok') ? 'ok' : (c.urls.some(u => u.status === 'blocked') ? 'blocked' : 'unreachable')
  const countries: Country[] = manifest?.by_country || []
  const filtered = countries.filter(c => filter === 'all' || best(c) === filter)
  const counts = { ok: countries.filter(c => best(c) === 'ok').length, blocked: countries.filter(c => best(c) === 'blocked').length, unreachable: countries.filter(c => best(c) === 'unreachable').length }
  const feed = events.slice(0, 10)

  useEffect(() => {
    document.title = 'Source Monitor · MotoPass'
  }, [])

  if (err) return <div style={s.err}>Source monitor unavailable — {err}</div>
  if (!manifest) return <div style={{ padding: 40, color: '#c99aab' }}>Loading live sources…</div>

  return (
    <div style={s.page}>
      <style>{s.mobile}</style>
      <div style={s.hero}>
        <h1 style={s.h1}>Know the moment a country <span style={s.h1accent}>changes its rules.</span></h1>
        <p style={s.p}>Every official passport, citizenship and immigration source we rely on is watched on a schedule. When a rule moves, you see it here — with proof it's real, before it touches the live program data.</p>
      </div>
      <div style={s.honesty}><span style={s.live}></span> Official sources re-checked every 24h · last verified {ago(manifest.generated_at)} · a flagged change goes through human review before it reaches the live rules — we never auto-publish.</div>

      <div style={s.chips}>
        {[['ok', 'Sources healthy', counts.ok], ['blocked', 'Blocked (bot-wall)', counts.blocked], ['unreachable', 'Unreachable', counts.unreachable]].map(([k, l, n]) => (
          <div key={k} style={s.chip}><div style={{ ...s.chipN, color: COLORS[k as Status] }}>{n}</div><div style={s.chipL}>{l}</div></div>
        ))}
        <div style={s.chip}><div style={s.chipN}>{manifest.total_urls}</div><div style={s.chipL}>Official URLs watched</div></div>
      </div>

      <div id="smLayout" style={s.layout}>
        <div>
          <div style={s.filters}>
            {['all', 'ok', 'blocked', 'unreachable'].map(f => (
              <button key={f} style={{ ...s.fb, ...(filter === f ? s.fbOn : {}) }} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : LABELS[f as keyof typeof LABELS]}</button>
            ))}
          </div>
          <div style={s.grid}>
            {filtered.map(c => {
              const b = best(c)
              const gap = c.coverage_gap_days || 0
              return (
                <div key={c.program_id} style={{ ...s.card, borderColor: b === 'ok' ? '#2a1220' : COLORS[b] }}>
                  <div style={{ float: 'right', width: 11, height: 11, borderRadius: 11, background: COLORS[b] }}></div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}<span style={{ ...s.muted, marginLeft: 6, fontSize: 10 }}>{c.program_id}</span>{c.changed ? <span style={{ background: COLORS.unreachable, color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 999, marginLeft: 8 }}>CHANGED</span> : null}</div>
                  <div style={{ ...s.muted, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.urls.map(u => host(u.url)).join(' · ')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11.5, color: '#8a5f70' }}>
                    <span style={{ color: COLORS[b], fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: '.04em' }}>{LABELS[b]}</span>
                    <span style={{ marginLeft: 'auto' }}>{gap ? `⚠ ${gapLabel(gap)}` : `${ago(c.urls[0]?.last_probed)}· fresh`}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={s.rail}>
          <div style={s.panel}>
            <div style={s.panelH}>Recent activity</div>
            {feed.length === 0 ? <div style={s.muted}>No confirmed rule changes yet — the watchdog is watching.</div> : feed.map((e, i) => (
              <div key={i} style={s.row}>
                <span style={{ ...s.dot, background: e.kind === 'rule' ? COLORS.unreachable : COLORS.blocked }}></span>
                <div><b>{e.country}</b> · <span style={s.muted}>{e.kind === 'rule' ? `rule change in ${(e.scopes || []).join(' · ') || 'rules'}` : e.status}</span>
                  {e.kind === 'rule' && (e.before || e.after) ? <div style={{ ...s.muted, marginTop: 4, background: '#14070c', padding: 6, borderRadius: 8, fontSize: 11 }}><span style={{ color: COLORS.unreachable }}>−{(e.before || '').slice(0, 90)}</span><br /><span style={{ color: COLORS.ok }}>+{(e.after || '').slice(0, 90)}</span></div> : null}</div>
                <div style={{ ...s.muted, marginLeft: 'auto', flexShrink: 0 }}>{ago(e.ts)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}