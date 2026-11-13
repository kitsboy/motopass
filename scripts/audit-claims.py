#!/usr/bin/env python3
"""
Claim-level audit of research/countries.json.

A figure counts as TRACED only when its record carries a claim_sources entry:

  "claim_sources": {
    "finance.min_investment_usd": {
      "url": "https://...",            # an official government/regulator page
      "quote": "under fifteen words",  # the exact words on that page
      "fetched": "2026-11-08"          # the day we read it
    }
  }

Anything else is UNSOURCED: it may not enter averages, comparisons, the
simulator's maths, or a hero card. This script prints the per-record table and
the corpus totals, and writes research/claim-audit.json + .md.

Exit code 0 always for ad-hoc runs; pass --fail-under N to make it a gate.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / 'research/countries.json'
OUT_JSON = ROOT / 'research/claim-audit.json'
OUT_MD = ROOT / 'research/claim-audit.md'

# Every numeric field a visitor can read on Home, Programs, Compare or Simulator.
MONEY_TIME_FIELDS = [
    'finance.min_investment_usd',
    'finance.typical_investment_usd',
    'finance.gov_fees_usd',
    'finance.processing_time_months',
]
SCORE_FIELDS = [
    'scorecard.crypto_friendly',
    'scorecard.freedom',
    'scorecard.stability',
    'scorecard.tax',
    'scorecard.cost',
    'scorecard.mobility',
    'scorecard.banking',
    'sovereignty_score',
]


def dig(rec, path):
    cur = rec
    for part in path.split('.'):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def figures_for(rec):
    """(field path, value) for every figure this record shows."""
    out = []
    for path in MONEY_TIME_FIELDS + SCORE_FIELDS:
        val = dig(rec, path)
        if val in (None, '', [], {}):
            continue
        out.append((path, val))
    for i, w in enumerate(rec.get('pathways') or []):
        if w.get('min_investment_usd') not in (None, 0):
            out.append((f'pathways[{i}].min_investment_usd', w['min_investment_usd']))
        for key in ('min_investment_ars', 'min_investment_local'):
            if w.get(key) not in (None, 0):
                out.append((f'pathways[{i}].{key}', w[key]))
    return out


def traced(rec, path):
    src = (rec.get('claim_sources') or {}).get(path)
    if not isinstance(src, dict):
        return False
    return bool(src.get('url') and src.get('quote') and src.get('fetched'))


def main():
    data = json.loads(CORPUS.read_text())
    programs = data['programs'] if isinstance(data, dict) else data

    rows = []
    total_figs = total_traced = 0
    money_time = {'shown': 0, 'traced': 0}
    for rec in programs:
        figs = figures_for(rec)
        ok = [p for p, _ in figs if traced(rec, p)]
        bad = [p for p, _ in figs if p not in ok]
        total_figs += len(figs)
        total_traced += len(ok)
        for p, _ in figs:
            if p in MONEY_TIME_FIELDS or p.startswith('pathways['):
                money_time['shown'] += 1
                if p in ok:
                    money_time['traced'] += 1
        rows.append(
            {
                'name': rec.get('name'),
                'figures_shown': len(figs),
                'figures_traced': len(ok),
                'unsourced_fields': bad,
                'has_claim_sources_key': 'claim_sources' in rec,
            }
        )

    report = {
        'generated_by': 'scripts/audit-claims.py',
        'corpus': str(CORPUS.relative_to(ROOT)),
        'records': len(programs),
        'figures_shown': total_figs,
        'figures_traced': total_traced,
        'coverage_pct': round(100 * total_traced / total_figs, 1) if total_figs else 0,
        'money_and_time': money_time,
        'per_record': rows,
    }
    OUT_JSON.write_text(json.dumps(report, indent=1))
    (ROOT / 'src/data/claimCoverage.json').write_text(
        json.dumps(
            {
                'records': report['records'],
                'figures_shown': total_figs,
                'figures_traced': total_traced,
                'coverage_pct': report['coverage_pct'],
                # Per record, so a card can say "N of M figures traced" without
                # re-deriving it in the browser.
                'per_record': {
                    r['name']: {
                        'traced': r['figures_traced'],
                        'shown': r['figures_shown'],
                    }
                    for r in rows
                },
                'generated_by': 'scripts/audit-claims.py',
            },
            indent=1,
        )
        + '\n'
    )

    lines = [
        '# Claim-level audit',
        '',
        f'Records: **{report["records"]}** · figures shown: **{total_figs}** · '
        f'traced to an official page: **{total_traced}** ({report["coverage_pct"]}%)',
        '',
        '| Record | Figures | Traced | Unsourced fields |',
        '| --- | --- | --- | --- |',
    ]
    for r in rows:
        listed = ', '.join(r['unsourced_fields']) if r['unsourced_fields'] else '—'
        lines.append(f'| {r["name"]} | {r["figures_shown"]} | {r["figures_traced"]} | {listed} |')
    OUT_MD.write_text('\n'.join(lines) + '\n')

    print(f'figures shown {total_figs} · traced {total_traced} · coverage {report["coverage_pct"]}%')
    print(f'money/time figures {money_time["shown"]} · traced {money_time["traced"]}')
    for r in rows[:6]:
        print(f'  {r["name"]}: {r["figures_shown"]} shown, {r["figures_traced"]} traced')

    gate = None
    for arg in sys.argv[1:]:
        if arg.startswith('--fail-under'):
            gate = float(sys.argv[sys.argv.index(arg) + 1]) if arg == '--fail-under' else float(arg.split('=')[1])
    if gate is not None and report['coverage_pct'] < gate:
        print(f'claim coverage {report["coverage_pct"]}% is below the required {gate}%')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
