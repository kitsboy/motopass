import type { LangCode } from './languages'

export type TranslationKey =
  | 'nav.pitch' | 'nav.portfolio' | 'nav.programs' | 'nav.simulator' | 'nav.compare' | 'nav.vault'
  | 'nav.blog' | 'nav.verify' | 'nav.agents' | 'nav.apply' | 'nav.dashboard'
  | 'tagline' | 'pitch.hero' | 'pitch.sub' | 'pitch.cta' | 'pitch.evolve'
  | 'blog.title' | 'blog.filter' | 'blog.read' | 'programs.title' | 'programs.search'
  | 'verify.title' | 'verify.sub' | 'verify.stamp' | 'agents.title' | 'agents.sub'
  | 'apply.title' | 'apply.sub' | 'apply.submit' | 'nostr.connect' | 'nostr.connected'
  | 'block.live' | 'footer.truth'

type Dict = Record<TranslationKey, string>

const en: Dict = {
  'nav.pitch': 'Pitch',
  'nav.portfolio': 'Portfolio',
  'nav.programs': 'Programs',
  'nav.simulator': 'Simulator',
  'nav.compare': 'Compare',
  'nav.vault': 'Vault',
  'nav.dashboard': 'Dashboard',
  'nav.blog': 'Insights',
  'nav.verify': 'Verify',
  'nav.agents': 'Agents',
  'nav.apply': 'Apply',
  tagline: 'Truth You Can Verify',
  'pitch.hero': 'Sovereign passports on Bitcoin rails',
  'pitch.sub': 'Timestamp applications. Connect via Nostr. Verify every claim on-chain with Satohash.',
  'pitch.cta': 'Explore programs',
  'pitch.evolve': 'Living pitch — updated with every BUILD',
  'blog.title': 'Sovereign insights',
  'blog.filter': 'Filter by topic',
  'blog.read': 'Read',
  'programs.title': 'Residency & citizenship programs',
  'programs.search': 'Search programs…',
  'verify.title': 'Verify on Bitcoin',
  'verify.sub': 'Every MotoPass data point anchors to OpenTimestamps via Satohash.io',
  'verify.stamp': 'Stamp application',
  'agents.title': 'Country liaison agents',
  'agents.sub': 'AI-assisted passport office liaisons — reachable on Nostr for verified applicants',
  'apply.title': 'Passport application tracker',
  'apply.sub': 'Register interest, timestamp your application hash, connect your npub',
  'apply.submit': 'Register & timestamp',
  'nostr.connect': 'Connect Nostr',
  'nostr.connected': 'Connected',
  'block.live': 'Bitcoin block',
  'footer.truth': 'Truth You Can Verify — Satohash + OpenTimestamps + Nostr',
}

const es: Dict = {
  ...en,
  'nav.pitch': 'Visión',
  'nav.programs': 'Programas',
  'nav.blog': 'Blog',
  'nav.verify': 'Verificar',
  'nav.agents': 'Agentes',
  'nav.apply': 'Solicitar',
  'pitch.hero': 'Pasaportes soberanos sobre rieles Bitcoin',
  'pitch.sub': 'Marca solicitudes. Conéctate vía Nostr. Verifica cada dato en cadena con Satohash.',
  'programs.title': 'Programas de residencia y ciudadanía',
}

const fr: Dict = {
  ...en,
  'nav.pitch': 'Vision',
  'nav.programs': 'Programmes',
  'nav.blog': 'Blog',
  'nav.verify': 'Vérifier',
  'nav.agents': 'Agents',
  'nav.apply': 'Postuler',
  'pitch.hero': 'Passeports souverains sur rails Bitcoin',
  'pitch.sub': 'Horodatez les demandes. Connectez-vous via Nostr. Vérifiez chaque donnée on-chain.',
}

const pt: Dict = {
  ...en,
  'nav.pitch': 'Visão',
  'nav.programs': 'Programas',
  'nav.blog': 'Blog',
  'nav.verify': 'Verificar',
  'nav.agents': 'Agentes',
  'nav.apply': 'Candidatar',
  'pitch.hero': 'Passaportes soberanos em trilhos Bitcoin',
}

const zh: Dict = {
  ...en,
  'nav.pitch': '愿景',
  'nav.programs': '项目',
  'nav.blog': '洞察',
  'nav.verify': '验证',
  'nav.agents': '代理',
  'nav.apply': '申请',
  'pitch.hero': '基于比特币rails的主权护照',
  'pitch.sub': '为申请加盖时间戳。通过Nostr连接。用Satohash链上验证。',
}

const ar: Dict = {
  ...en,
  'nav.pitch': 'الرؤية',
  'nav.programs': 'البرامج',
  'nav.blog': 'مدونة',
  'nav.verify': 'تحقق',
  'nav.agents': 'وكلاء',
  'nav.apply': 'تقديم',
  'pitch.hero': 'جوازات سيادية على قضبان البيتكوين',
  'pitch.sub': 'ختم الطلبات. الاتصال عبر Nostr. تحقق من كل بيان على السلسلة عبر Satohash.',
}

const sw: Dict = {
  ...en,
  'nav.pitch': 'Dira',
  'nav.programs': 'Programu',
  'nav.blog': 'Maarifa',
  'nav.verify': 'Thibitisha',
  'nav.agents': 'Mawakala',
  'nav.apply': 'Omba',
  'pitch.hero': 'Pasipoti za uhuru kwenye reli za Bitcoin',
}

const de: Dict = {
  ...en,
  'nav.pitch': 'Vision',
  'nav.programs': 'Programme',
  'nav.blog': 'Blog',
  'nav.verify': 'Verifizieren',
  'nav.agents': 'Agenten',
  'nav.apply': 'Bewerben',
  'pitch.hero': 'Souveräne Pässe auf Bitcoin-Schienen',
}

const hi: Dict = {
  ...en,
  'nav.pitch': 'दृष्टि',
  'nav.programs': 'कार्यक्रम',
  'nav.blog': 'ब्लॉग',
  'nav.verify': 'सत्यापित',
  'nav.agents': 'एजेंट',
  'nav.apply': 'आवेदन',
  'pitch.hero': 'बिटकॉइन रेल्स पर संप्रभु पासपोर्ट',
}

export const TRANSLATIONS: Record<LangCode, Dict> = { en, es, fr, pt, zh, ar, sw, de, hi }

export function t(lang: LangCode, key: TranslationKey): string {
  return TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key
}