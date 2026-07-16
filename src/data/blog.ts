import type { LangCode } from '../i18n/languages'

export interface BlogPost {
  id: string
  slug: string
  date: string
  labels: string[]
  langs: LangCode[]
  title: Record<LangCode, string>
  excerpt: Record<LangCode, string>
  seoKeywords: string[]
  /** Optional hero image — defaults to site OG image when omitted */
  coverImage?: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'truth-you-can-verify-launch',
    date: '2026-07-02',
    labels: ['sovereignty', 'satohash', 'bitcoin'],
    langs: ['en', 'es', 'fr', 'pt', 'zh', 'ar', 'sw', 'de', 'hi', 'ja'],
    title: {
      en: 'MotoPass launches Truth You Can Verify on Bitcoin',
      es: 'MotoPass lanza Verdad que Puedes Verificar en Bitcoin',
      fr: 'MotoPass lance La Vérité que Vous Pouvez Vérifier sur Bitcoin',
      pt: 'MotoPass lança Verdade que Você Pode Verificar no Bitcoin',
      zh: 'MotoPass在比特币上推出可验证真相',
      ar: 'MotoPass تطلق الحقيقة التي يمكنك التحقق منها على البيتكوين',
      sw: 'MotoPass inazindua Ukweli Unaweza Kuthibitisha kwenye Bitcoin',
      de: 'MotoPass startet Wahrheit, die Sie auf Bitcoin verifizieren können',
      hi: 'MotoPass ने Bitcoin पर सत्यापन योग्य सत्य लॉन्च किया',
      ja: 'MotoPass、Bitcoin上で検証可能な真実をローンチ',
    },
    excerpt: {
      en: 'Every residency program, cost figure, and application milestone can now anchor to OpenTimestamps via Satohash.io — our Give A Bit verification layer.',
      es: 'Cada programa, cifra y hito de solicitud puede anclarse a OpenTimestamps vía Satohash.io.',
      fr: 'Chaque programme, chiffre et étape peut s\'ancrer via OpenTimestamps et Satohash.io.',
      pt: 'Cada programa, valor e marco pode ancorar via OpenTimestamps e Satohash.io.',
      zh: '每个项目、费用和申请里程碑可通过Satohash.io锚定到OpenTimestamps。',
      ar: 'يمكن لكل برنامج ورقم ومرحلة طلب الارتساء عبر Satohash.io.',
      sw: 'Kila programu, gharama na hatua inaweza kuhusishwa na Satohash.io.',
      de: 'Jedes Programm und jeder Meilenstein verankert sich über Satohash.io.',
      hi: 'हर कार्यक्रम और आवेदन मील का पत्थर Satohash.io के माध्यम से एंकर हो सकता है।',
      ja: 'すべての居住プログラム、費用、申請マイルストーンをSatohash.io経由でOpenTimestampsにアンカーできます。',
    },
    seoKeywords: ['bitcoin passport', 'CBI verification', 'OpenTimestamps', 'Satohash'],
  },
  {
    id: '2',
    slug: 'nostr-passport-applications',
    date: '2026-07-01',
    labels: ['nostr', 'applications', 'agents'],
    langs: ['en', 'es', 'fr', 'ar', 'sw'],
    title: {
      en: 'Nostr-native passport applications: connect your npub',
      es: 'Solicitudes de pasaporte nativas Nostr: conecta tu npub',
      fr: 'Demandes de passeport Nostr : connectez votre npub',
      pt: 'Candidaturas Nostr: conecte seu npub',
      zh: 'Nostr原生护照申请：连接你的npub',
      ar: 'طلبات جواز السفر عبر Nostr: اربط npub الخاص بك',
      sw: 'Maombi ya pasipoti kupitia Nostr:unganisha npub yako',
      de: 'Nostr-Passanträge: verbinden Sie Ihre npub',
      hi: 'Nostr पासपोर्ट आवेदन: अपना npub कनेक्ट करें',
      ja: 'Nostrネイティブのパスポート申請：npubを接続',
    },
    excerpt: {
      en: 'Real applicants with Nostr accounts can register interest and be matched with country liaison AI agents — no email required.',
      es: 'Solicitantes reales con cuentas Nostr pueden registrarse sin correo electrónico.',
      fr: 'Les candidats avec un compte Nostr peuvent s\'inscrire sans email.',
      pt: 'Candidatos com conta Nostr podem registrar interesse sem email.',
      zh: '拥有Nostr账户的申请人可注册意向，无需电子邮件。',
      ar: 'المتقدمون الحقيقيون بحسابات Nostr يمكنهم التسجيل دون بريد إلكتروني.',
      sw: 'Waombaji halisi na akaunti za Nostr wanaweza kusajili bila barua pepe.',
      de: 'Bewerber mit Nostr-Konto können sich ohne E-Mail registrieren.',
      hi: 'Nostr खाते वाले आवेदक बिना ईमेल के रुचि दर्ज कर सकते हैं।',
      ja: 'Nostrアカウントを持つ申請者はメール不要で関心を登録し、国別エージェントとマッチングできます。',
    },
    seoKeywords: ['nostr passport', 'npub identity', 'CBI application'],
  },
  {
    id: '3',
    slug: 'el-salvador-bitcoin-legal-tender',
    date: '2026-06-28',
    labels: ['cbi-rbi', 'bitcoin', 'policy'],
    langs: ['en', 'es', 'pt'],
    title: {
      en: 'El Salvador: Bitcoin legal tender and residency pathways',
      es: 'El Salvador: moneda legal Bitcoin y vías de residencia',
      fr: 'El Salvador : monnaie légale Bitcoin',
      pt: 'El Salvador: moeda legal Bitcoin e residência',
      zh: '萨尔瓦多：比特币法定货币与居留途径',
      ar: 'السلفادور: البيتكوين عملة قانونية',
      sw: 'El Salvador: Bitcoin kama sarafu halali',
      de: 'El Salvador: Bitcoin als gesetzliches Zahlungsmittel',
      hi: 'एल सल्वाडोर: बिटकॉइन कानूनी टेंडर',
      ja: 'エルサルバドル：ビットコイン法貨と居住パス',
    },
    excerpt: {
      en: 'Deep dive on the first Bitcoin legal tender nation — investment thresholds, Lightning readiness, and MotoPass pilot opportunities.',
      es: 'Análisis del primer país con Bitcoin como moneda legal.',
      fr: 'Analyse du premier pays à adopter Bitcoin.',
      pt: 'Análise do primeiro país com Bitcoin legal.',
      zh: '首个比特币法定货币国家深度分析。',
      ar: 'تحليل عميق لأول دولة تعتمد البيتكوين.',
      sw: 'Uchambuzi wa kina wa nchi ya kwanza ya Bitcoin.',
      de: 'Tiefenanalyse des ersten Bitcoin-Legal-Tender-Landes.',
      hi: 'पहले बिटकॉइन कानूनी टेंडर देश का विश्लेषण।',
      ja: '初のビットコイン法貨国の深掘り — 投資閾値、Lightning対応、MotoPassパイロット機会。',
    },
    seoKeywords: ['El Salvador residency', 'bitcoin legal tender', 'Lightning'],
  },
  {
    id: '4',
    slug: 'country-liaison-agents',
    date: '2026-06-25',
    labels: ['agents', 'applications', 'cbi-rbi'],
    langs: ['en', 'fr', 'de', 'zh'],
    title: {
      en: 'Country liaison AI agents for passport offices',
      es: 'Agentes IA de enlace para oficinas de pasaportes',
      fr: 'Agents IA de liaison pour les bureaux de passeports',
      pt: 'Agentes IA de ligação para escritórios de passaporte',
      zh: '护照办公室联络AI代理',
      ar: 'وكلاء ذكاء اصطناعي للمكاتب الرسمية',
      sw: 'Mawakala wa AI kwa ofisi za pasipoti',
      de: 'KI-Verbindungsagenten für Passämter',
      hi: 'पासपोर्ट कार्यालयों के लिए संपर्क AI एजेंट',
      ja: 'パスポート窓口向け国別リエゾンAIエージェント',
    },
    excerpt: {
      en: 'How MotoPass connects verified Nostr users with jurisdiction-specific liaison agents — streamlining official passport and residency conversations.',
      es: 'Cómo MotoPass conecta usuarios Nostr verificados con agentes por jurisdicción.',
      fr: 'Comment MotoPass connecte les utilisateurs Nostr vérifiés aux agents par juridiction.',
      pt: 'Como o MotoPass conecta usuários Nostr verificados a agentes.',
      zh: 'MotoPass如何将已验证的Nostr用户与辖区联络代理连接。',
      ar: 'كيف يربط MotoPass المستخدمين المعتمدين بوكلاء الاختصاص.',
      sw: 'Jinsi MotoPass inaunganisha watumiaji wa Nostr na mawakala.',
      de: 'Wie MotoPass verifizierte Nostr-Nutzer mit Agenten verbindet.',
      hi: 'MotoPass सत्यापित Nostr उपयोगकर्ताओं को एजेंटों से कैसे जोड़ता है।',
      ja: 'MotoPassが検証済みNostrユーザーと法域別エージェントをつなぐ方法。',
    },
    seoKeywords: ['passport agent', 'CBI liaison', 'immigration AI'],
  },
]