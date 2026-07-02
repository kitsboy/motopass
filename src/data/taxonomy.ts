import type { LangCode } from '../i18n/languages'

export interface TaxonomyLabel {
  id: string
  slug: string
  color: string
  names: Partial<Record<LangCode, string>> & { en: string }
}

export const TAXONOMY: TaxonomyLabel[] = [
  { id: 'sovereignty', slug: 'sovereignty', color: '#F7931A', names: { en: 'Sovereignty', es: 'Soberanía', fr: 'Souveraineté', pt: 'Soberania', zh: '主权', ar: 'السيادة', sw: 'Uhuru', de: 'Souveränität', hi: 'संप्रभुता' } },
  { id: 'cbi-rbi', slug: 'cbi-rbi', color: '#22c55e', names: { en: 'CBI / RBI', es: 'CBI / RBI', fr: 'CBI / RBI', pt: 'CBI / RBI', zh: '投资入籍', ar: 'الجنسية بالاستثمار', sw: 'CBI / RBI', de: 'CBI / RBI', hi: 'CBI / RBI' } },
  { id: 'bitcoin', slug: 'bitcoin', color: '#F7931A', names: { en: 'Bitcoin Rails', es: 'Rieles Bitcoin', fr: 'Rails Bitcoin', pt: 'Trilhos Bitcoin', zh: '比特币', ar: 'بيتكوين', sw: 'Bitcoin', de: 'Bitcoin', hi: 'बिटकॉइन' } },
  { id: 'nostr', slug: 'nostr', color: '#a855f7', names: { en: 'Nostr Identity', es: 'Identidad Nostr', fr: 'Identité Nostr', pt: 'Identidade Nostr', zh: 'Nostr身份', ar: 'هوية Nostr', sw: 'Utambulisho Nostr', de: 'Nostr-Identität', hi: 'Nostr पहचान' } },
  { id: 'satohash', slug: 'satohash', color: '#38bdf8', names: { en: 'Satohash Proofs', es: 'Pruebas Satohash', fr: 'Preuves Satohash', pt: 'Provas Satohash', zh: 'Satohash证明', ar: 'إثباتات Satohash', sw: 'Uthibitisho Satohash', de: 'Satohash-Beweise', hi: 'Satohash प्रमाण' } },
  { id: 'lightning', slug: 'lightning', color: '#facc15', names: { en: 'Lightning', es: 'Lightning', fr: 'Lightning', pt: 'Lightning', zh: '闪电网络', ar: 'لايتنينغ', sw: 'Lightning', de: 'Lightning', hi: 'Lightning' } },
  { id: 'tax', slug: 'tax', color: '#34d399', names: { en: 'Tax Optimization', es: 'Optimización fiscal', fr: 'Optimisation fiscale', pt: 'Otimização fiscal', zh: '税务优化', ar: 'التحسين الضريبي', sw: 'Kodi', de: 'Steueroptimierung', hi: 'कर अनुकूलन' } },
  { id: 'policy', slug: 'policy', color: '#f59e0b', names: { en: 'Policy Updates', es: 'Actualizaciones', fr: 'Mises à jour', pt: 'Atualizações', zh: '政策更新', ar: 'تحديثات السياسة', sw: 'Sera', de: 'Richtlinien', hi: 'नीति अपडेट' } },
  { id: 'agents', slug: 'agents', color: '#818cf8', names: { en: 'Liaison Agents', es: 'Agentes de enlace', fr: 'Agents de liaison', pt: 'Agentes de ligação', zh: '联络代理', ar: 'وكلاء الاتصال', sw: 'Mawakala', de: 'Verbindungsagenten', hi: 'संपर्क एजेंट' } },
  { id: 'applications', slug: 'applications', color: '#fb7185', names: { en: 'Applications', es: 'Solicitudes', fr: 'Demandes', pt: 'Candidaturas', zh: '申请', ar: 'الطلبات', sw: 'Maombi', de: 'Anträge', hi: 'आवेदन' } },
]

export function labelName(id: string, lang: LangCode): string {
  const item = TAXONOMY.find(t => t.id === id)
  if (!item) return id
  return item.names[lang] ?? item.names.en
}