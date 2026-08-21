/**
 * Hardcore SEO keyword map — 10 languages × 15 routes × primary/secondary/long-tail keywords.
 *
 * Each route has:
 * - title: optimized for search engines (max 60 chars)
 * - description: compelling meta description (max 160 chars)
 * - keywords: primary, secondary, and long-tail terms for internal reference
 * - h1: the main heading the page should have
 *
 * Keywords target the sovereign mobility / Bitcoin passport / crypto golden visa niche
 * in every language MotoPass supports.
 */

import type { LangCode } from '../i18n/languages'

export type SeoKeywords = {
  title: string
  description: string
  keywords: string[]
  h1: string
}

export type RouteSeoKeywords = Record<string, SeoKeywords>

// ── English ──────────────────────────────────────────────────────────────────

const en: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Bitcoin Sovereign Passports & Residency Intelligence',
    description:
      'Evaluate 50 Bitcoin visa and crypto golden visa programs with ₿-first pricing, Satohash proofs, and Nostr identity. Truth You Can Verify.',
    keywords: [
      'bitcoin passport', 'sovereign passport', 'crypto golden visa',
      'residency by investment', 'bitcoin visa', 'sovereign mobility',
      'satohash verification', 'nostr identity', 'CBI program', 'RBI program',
    ],
    h1: 'Bitcoin-Native Sovereign Passport Intelligence',
  },
  '/programs': {
    title: '50 Bitcoin Visa & Crypto Golden Visa Programs — MotoPass',
    description:
      'Browse 50 sovereign passport and Bitcoin visa programs — crypto golden visa, residency-by-investment with Lightning readiness, ₿ costs, and Satohash proof.',
    keywords: [
      'bitcoin visa programs', 'crypto golden visa', 'residency by investment programs',
      'CBI programs 2026', 'RBI programs', 'sovereign passport programs',
      'lightning ready residency', 'satohash verified programs',
    ],
    h1: 'Residency & Citizenship Programs — 50 Jurisdictions',
  },
  '/portfolio': {
    title: 'Sovereign Mobility Portfolio — Track Your Programs',
    description:
      'Track saved CBI, RBI, and Bitcoin-native residency programs. Compliance Clock, combined stats, and sovereign stack planning.',
    keywords: [
      'sovereign portfolio', 'passport portfolio tracker', 'CBI portfolio',
      'residency stack', 'compliance clock', 'program tracker',
    ],
    h1: 'Your Sovereign Mobility Portfolio',
  },
  '/simulator': {
    title: 'Stack Simulator — Model Multi-Jurisdiction Passport Stacks',
    description:
      'Combine multiple programs and model total cost, sovereignty score, and processing timelines. Value Forks show pathway-level capital analysis.',
    keywords: [
      'passport stack simulator', 'multi-jurisdiction planning', 'sovereignty score',
      'value forks', 'program cost calculator', 'residency stack model',
    ],
    h1: 'Jurisdictional Stack Simulator',
  },
  '/compare': {
    title: 'Compare Bitcoin Visa Programs — Side by Side',
    description:
      'Side-by-side comparison of program investment thresholds, government fees, tax benefits, Bitcoin integration, and sovereignty scores.',
    keywords: [
      'compare CBI programs', 'compare RBI programs', 'bitcoin visa comparison',
      'golden visa side by side', 'program investment comparison',
    ],
    h1: 'Side-by-Side Program Comparison',
  },
  '/btcmap': {
    title: 'BTC Map — Bitcoin Merchant Layer per Jurisdiction',
    description:
      'Cross-reference sovereign jurisdictions with BTC Map — live Bitcoin-accepting merchants, Lightning venues, and merchant density per country.',
    keywords: [
      'btc map', 'bitcoin merchants map', 'lightning network merchants',
      'bitcoin acceptance by country', 'crypto merchants directory',
    ],
    h1: 'BTC Map — Bitcoin Merchant Discovery',
  },
  '/vault': {
    title: 'Vault — Bitcoin-Anchored Document Stamping & Proofs',
    description:
      'Stamp documents with Satohash OpenTimestamps proofs. SHA-256 hash anchoring on Bitcoin blockchain. Export, import, and verify your proof archive.',
    keywords: [
      'document stamping bitcoin', 'opentimestamps vault', 'satohash proofs',
      'bitcoin document verification', 'SHA-256 hash anchor',
    ],
    h1: 'Research Vault — Timestamp Proofs',
  },
  '/distressed': {
    title: 'Distressed Marketplace — Proof-Gated Sovereign Value Plays',
    description:
      'Browse Kimi-curated and permissionless distressed RBI/CBI listings — ₿ asks, Satohash proofs required, and template escrow.',
    keywords: [
      'distressed CBI', 'distressed RBI', 'proof-gated listings',
      'sovereign value plays', 'bitcoin escrow', 'curated residency deals',
    ],
    h1: 'Distressed Marketplace — Proof-Gated Deals',
  },
  '/blog': {
    title: 'Sovereign Mobility Insights — Bitcoin Passport Blog',
    description:
      'Multilingual articles on Bitcoin passports, Nostr applications, CBI/RBI policy, crypto golden visa news, and country liaison agents.',
    keywords: [
      'bitcoin passport blog', 'sovereign mobility news', 'CBI policy updates',
      'crypto golden visa news', 'nostr applications', 'residency news',
    ],
    h1: 'Sovereign Mobility Insights',
  },
  '/verify': {
    title: 'Verify on Bitcoin — Satohash OpenTimestamps Proof Checker',
    description:
      'Generate, stamp, and verify Satohash.io OpenTimestamps proofs. Batch verify, paste OTS files, and check hash history on Bitcoin.',
    keywords: [
      'verify bitcoin proof', 'opentimestamps checker', 'satohash verify',
      'batch verify hashes', 'bitcoin timestamp verification',
    ],
    h1: 'Verify on Bitcoin',
  },
  '/agents': {
    title: 'Country Liaison Agents — AI Passport Office Connectors',
    description:
      'Meet jurisdiction-specific AI liaison agents that connect verified Nostr applicants with passport offices. Office hours, DM handoff, and escalation.',
    keywords: [
      'passport liaison agent', 'AI immigration agent', 'nostr agent',
      'country liaison', 'passport office connector', 'kimi agent',
    ],
    h1: 'Country Liaison Agents',
  },
  '/apply': {
    title: 'Apply — Bitcoin-Native Passport Application',
    description:
      'Register sovereign mobility interest with your Nostr npub — no email required. Stamp application hash on Bitcoin. Matched with liaison agents.',
    keywords: [
      'apply bitcoin passport', 'nostr application', 'sovereign mobility application',
      'passport interest form', 'bitcoin stamped application',
    ],
    h1: 'Passport Application Tracker',
  },
  '/register': {
    title: 'Register — Nostr-Native MotoPass Identity',
    description:
      'Create your MotoPass profile with Nostr Connect. npub-native applications, policy alerts, and sovereign mobility identity.',
    keywords: [
      'register motopass', 'nostr identity', 'npub registration',
      'sovereign identity', 'bitcoin passport account',
    ],
    h1: 'Register with Nostr',
  },
  '/dashboard': {
    title: 'Dashboard — Sovereign Mobility Command Center',
    description:
      'Your MotoPass command center — proactive alerts, document registry, application progress, and Nostr-connected sovereign tools.',
    keywords: [
      'motopass dashboard', 'sovereign mobility dashboard', 'application tracker',
      'document registry', 'alert inbox',
    ],
    h1: 'Your Sovereign Dashboard',
  },
  '/profile': {
    title: 'Profile — Your Sovereign Mobility Identity',
    description:
      'Manage your Nostr-linked MotoPass profile, stamped documents, and sovereign mobility application history.',
    keywords: [
      'motopass profile', 'sovereign identity profile', 'nostr profile',
      'document stamping profile',
    ],
    h1: 'Your Sovereign Profile',
  },
}

// ── Spanish ──────────────────────────────────────────────────────────────────

const es: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Pasaportes Soberanos Bitcoin e Inteligencia de Residencia',
    description:
      'Evalúa 50 programas de visa Bitcoin y visa dorada crypto con precios en ₿, pruebas Satohash e identidad Nostr. Verdad que puedes comprobar.',
    keywords: [
      'pasaporte bitcoin', 'pasaporte soberano', 'visa dorada crypto',
      'residencia por inversión', 'visa bitcoin', 'movilidad soberana',
    ],
    h1: 'Inteligencia de Pasaportes Soberanos Bitcoin',
  },
  '/programs': {
    title: '50 Programas de Visa Bitcoin y Visa Dorada Crypto — MotoPass',
    description:
      'Explora 50 programas de pasaporte soberano y visa Bitcoin — visa dorada crypto, residencia por inversión con Lightning, costos en ₿ y pruebas Satohash.',
    keywords: [
      'programas visa bitcoin', 'visa dorada crypto', 'residencia por inversión',
      'programas CBI 2026', 'programas RBI', 'pasaporte soberano',
    ],
    h1: 'Programas de Residencia y Ciudadanía — 50 Jurisdicciones',
  },
  '/portfolio': {
    title: 'Portafolio de Movilidad Soberana — Tus Programas',
    description:
      'Rastrea programas CBI, RBI y de residencia Bitcoin. Reloj de cumplimiento, estadísticas combinadas y planificación de stack soberano.',
    keywords: [
      'portafolio soberano', 'rastreador pasaporte', 'portafolio CBI',
      'stack de residencia', 'reloj de cumplimiento',
    ],
    h1: 'Tu Portafolio de Movilidad Soberana',
  },
  '/simulator': {
    title: 'Simulador de Stack — Modela Stacks de Pasaporte Multi-Jurisdicción',
    description:
      'Combina programas y modela costo total, puntuación de soberanía y plazos. Value Forks muestra análisis de capital por pathway.',
    keywords: [
      'simulador pasaporte', 'planificación multi-jurisdicción', 'puntuación soberanía',
      'value forks', 'calculadora costos programa',
    ],
    h1: 'Simulador de Stack Jurisdiccional',
  },
  '/compare': {
    title: 'Comparar Programas Visa Bitcoin — Lado a Lado',
    description:
      'Comparación lado a lado de umbrales de inversión, tarifas gubernamentales, beneficios fiscales e integración Bitcoin.',
    keywords: [
      'comparar programas CBI', 'comparar programas RBI', 'comparación visa bitcoin',
      'golden visa comparación', 'comparación inversiones',
    ],
    h1: 'Comparación de Programas Lado a Lado',
  },
  '/btcmap': {
    title: 'BTC Map — Capa de Comerciantes Bitcoin por Jurisdicción',
    description:
      'Cruza jurisdicciones soberanas con BTC Map — comerciantes Bitcoin, venues Lightning y densidad de comerciantes por país.',
    keywords: [
      'btc map', 'mapa comerciantes bitcoin', 'comerciantes lightning network',
      'aceptación bitcoin por país', 'directorio crypto',
    ],
    h1: 'BTC Map — Descubrimiento de Comerciantes Bitcoin',
  },
  '/vault': {
    title: 'Bóveda — Sellado de Documentos y Pruebas Bitcoin',
    description:
      'Sella documentos con pruebas Satohash OpenTimestamps. Anclaje SHA-256 en blockchain Bitcoin. Exporta, importa y verifica tu archivo.',
    keywords: [
      'sellado documentos bitcoin', 'opentimestamps bóveda', 'pruebas satohash',
      'verificación documentos bitcoin', 'anclaje SHA-256',
    ],
    h1: 'Bóveda de Investigación — Pruebas de Sellado',
  },
  '/distressed': {
    title: 'Mercado Distressed — Oportunidades Soberanas con Prueba',
    description:
      'Explora listados curados y sin permiso de RBI/CBI distressed — peticiones en ₿, pruebas Satohash obligatorias y escrow plantilla.',
    keywords: [
      'distressed CBI', 'distressed RBI', 'listados con prueba',
      'oportunidades soberanas', 'escrow bitcoin', 'ofertas residencia curadas',
    ],
    h1: 'Mercado Distressed — Ofertas con Prueba',
  },
  '/blog': {
    title: 'Perspectivas de Movilidad Soberana — Blog Pasaporte Bitcoin',
    description:
      'Artículos multilingües sobre pasaportes Bitcoin, aplicaciones Nostr, política CBI/RBI, noticias de visa dorada crypto y agentes de enlace.',
    keywords: [
      'blog pasaporte bitcoin', 'noticias movilidad soberana', 'actualizaciones CBI',
      'noticias visa dorada crypto', 'aplicaciones nostr',
    ],
    h1: 'Perspectivas de Movilidad Soberana',
  },
  '/verify': {
    title: 'Verificar en Bitcoin — Comprobador de Pruebas Satohash',
    description:
      'Genera, sella y verifica pruebas Satohash.io OpenTimestamps. Verificación por lotes, pegar archivos OTS y verificar hashes en Bitcoin.',
    keywords: [
      'verificar prueba bitcoin', 'comprobador opentimestamps', 'satohash verificar',
      'verificar hashes por lotes', 'verificación timestamp bitcoin',
    ],
    h1: 'Verificar en Bitcoin',
  },
  '/agents': {
    title: 'Agentes de Enlace por País — Conectores de Oficinas de Pasaporte',
    description:
      'Conoce agentes de enlace IA por jurisdicción que conectan solicitantes Nostr verificados con oficinas de pasaporte.',
    keywords: [
      'agente enlace pasaporte', 'agente inmigración IA', 'agente nostr',
      'enlace por país', 'conector oficina pasaporte',
    ],
    h1: 'Agentes de Enlace por País',
  },
  '/apply': {
    title: 'Solicitar — Pasaporte Bitcoin Nativo',
    description:
      'Registra interés de movilidad soberana con tu npub Nostr — sin correo. Sella hash de solicitud en Bitcoin. Conectado con agentes de enlace.',
    keywords: [
      'solicitar pasaporte bitcoin', 'aplicación nostr', 'solicitud movilidad soberana',
      'formulario interés pasaporte', 'solicitud sellada bitcoin',
    ],
    h1: 'Rastreador de Solicitud de Pasaporte',
  },
  '/register': {
    title: 'Registrarse — Identidad Nostr de MotoPass',
    description:
      'Crea tu perfil MotoPass con Nostr Connect. Solicitudes con npub, alertas de política e identidad de movilidad soberana.',
    keywords: [
      'registrar motopass', 'identidad nostr', 'registro npub',
      'identidad soberana', 'cuenta pasaporte bitcoin',
    ],
    h1: 'Registrarse con Nostr',
  },
  '/dashboard': {
    title: 'Panel — Centro de Comando de Movilidad Soberana',
    description:
      'Tu centro de comando MotoPass — alertas proactivas, registro de documentos, progreso de solicitud y herramientas soberanas.',
    keywords: [
      'panel motopass', 'panel movilidad soberana', 'rastreador solicitud',
      'registro documentos', 'bandeja de alertas',
    ],
    h1: 'Tu Panel Soberano',
  },
  '/profile': {
    title: 'Perfil — Tu Identidad de Movilidad Soberana',
    description:
      'Gestiona tu perfil MotoPass vinculado a Nostr, documentos sellados e historial de solicitudes.',
    keywords: [
      'perfil motopass', 'perfil identidad soberana', 'perfil nostr',
      'perfil sellado documentos',
    ],
    h1: 'Tu Perfil Soberano',
  },
}

// ── French ───────────────────────────────────────────────────────────────────

const fr: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Passeports Souverains Bitcoin et Intelligence Résidentielle',
    description:
      'Évaluez 50 programmes de visa Bitcoin et visa dorée crypto avec tarifs en ₿, preuves Satohash et identité Nostr. Une vérité vérifiable.',
    keywords: [
      'passeport bitcoin', 'passeport souverain', 'visa dorée crypto',
      'résidence par investissement', 'visa bitcoin', 'mobilité souveraine',
    ],
    h1: 'Intelligence Passeport Souverain Bitcoin',
  },
  '/programs': {
    title: '50 Programmes Visa Bitcoin et Visa Dorée Crypto — MotoPass',
    description:
      'Parcourez 50 programmes de passeport souverain et visa Bitcoin — visa dorée crypto, résidence par investissement avec Lightning, coûts en ₿ et preuves Satohash.',
    keywords: [
      'programmes visa bitcoin', 'visa dorée crypto', 'résidence par investissement',
      'programmes CBI 2026', 'programmes RBI', 'passeport souverain',
    ],
    h1: 'Programmes de Résidence et Citoyenneté — 50 Juridictions',
  },
  '/portfolio': {
    title: 'Portefeuille Mobilité Souveraine — Vos Programmes',
    description:
      'Suivez les programmes CBI, RBI et résidence Bitcoin. Horloge de conformité, statistiques combinées et planification de stack souverain.',
    keywords: [
      'portefeuille souverain', 'suiveur passeport', 'portefeuille CBI',
      'stack résidence', 'horloge conformité',
    ],
    h1: 'Votre Portefeuille Mobilité Souveraine',
  },
  '/simulator': {
    title: 'Simulateur de Stack — Modélisez des Stacks Multi-Juridiction',
    description:
      'Combinez des programmes et modélisez coût total, score de souveraineté et délais. Value Forks analyse le capital par pathway.',
    keywords: [
      'simulateur passeport', 'planification multi-juridiction', 'score souveraineté',
      'value forks', 'calculateur coût programme',
    ],
    h1: 'Simulateur de Stack Juridictionnel',
  },
  '/compare': {
    title: 'Comparer les Programmes Visa Bitcoin — Côte à Côte',
    description:
      'Comparaison côte à côte des seuils d\'investissement, frais gouvernementaux, avantages fiscaux et intégration Bitcoin.',
    keywords: [
      'comparer programmes CBI', 'comparer programmes RBI', 'comparaison visa bitcoin',
      'golden visa comparaison', 'comparaison investissements',
    ],
    h1: 'Comparaison de Programmes Côte à Côte',
  },
  '/btcmap': {
    title: 'BTC Map — Couche Marchands Bitcoin par Juridiction',
    description:
      'Recoupez juridictions souveraines avec BTC Map — marchands Bitcoin live, venues Lightning et densité de marchands par pays.',
    keywords: [
      'btc map', 'carte marchands bitcoin', 'marchands lightning network',
      'acceptation bitcoin par pays', 'répertoire crypto',
    ],
    h1: 'BTC Map — Découverte Marchands Bitcoin',
  },
  '/vault': {
    title: 'Coffre — Horodatage de Documents et Preuves Bitcoin',
    description:
      'Horodatez des documents avec des preuves Satohash OpenTimestamps. Ancrage SHA-256 sur la blockchain Bitcoin. Exportez, importez et vérifiez.',
    keywords: [
      'horodatage document bitcoin', 'opentimestamps coffre', 'preuves satohash',
      'vérification document bitcoin', 'ancrage SHA-256',
    ],
    h1: 'Coffre de Recherche — Preuves Horodatées',
  },
  '/distressed': {
    title: 'Marché Distressed — Opportunités Souveraines Vérifiables',
    description:
      'Parcourez les annonces curated et permissionless de RBI/CBI distressed — demandes en ₿, preuves Satohash requises et escrow modèle.',
    keywords: [
      'distressed CBI', 'distressed RBI', 'annonces avec preuve',
      'opportunités souveraines', 'escrow bitcoin', 'offres résidence curatées',
    ],
    h1: 'Marché Distressed — Offres Vérifiables',
  },
  '/blog': {
    title: 'Perspectives Mobilité Souveraine — Blog Passeport Bitcoin',
    description:
      'Articles multilingues sur passeports bitcoin, applications Nostr, politique CBI/RBI, actualités visa dorée crypto et agents de liaison.',
    keywords: [
      'blog passeport bitcoin', 'actualités mobilité souveraine', 'mises à jour CBI',
      'actualités visa dorée crypto', 'applications nostr',
    ],
    h1: 'Perspectives Mobilité Souveraine',
  },
  '/verify': {
    title: 'Vérifier sur Bitcoin — Vérificateur de Preuves Satohash',
    description:
      'Générez, horodatez et vérifiez les preuves Satohash.io OpenTimestamps. Vérification en lot, collage de fichiers OTS et contrôle de hash.',
    keywords: [
      'vérifier preuve bitcoin', 'vérificateur opentimestamps', 'satohash vérifier',
      'vérifier hashes en lot', 'vérification timestamp bitcoin',
    ],
    h1: 'Vérifier sur Bitcoin',
  },
  '/agents': {
    title: 'Agents de Liaison par Pays — Connecteurs de Bureaux de Passeport',
    description:
      'Rencontrez des agents de liaison IA par juridiction qui connectent les candidats Nostr vérifiés avec les bureaux de passeport.',
    keywords: [
      'agent liaison passeport', 'agent immigration IA', 'agent nostr',
      'liaison par pays', 'connecteur bureau passeport',
    ],
    h1: 'Agents de Liaison par Pays',
  },
  '/apply': {
    title: 'Postuler — Passeport Bitcoin Natif',
    description:
      'Enregistrez votre intérêt mobilité souveraine avec votre npub Nostr — sans e-mail. Horodatez le hash de la demande sur Bitcoin.',
    keywords: [
      'postuler passeport bitcoin', 'application nostr', 'demande mobilité souveraine',
      'formulaire intérêt passeport', 'demande horodatée bitcoin',
    ],
    h1: 'Suivi de Demande de Passeport',
  },
  '/register': {
    title: 'S\'inscrire — Identité Nostr Natif MotoPass',
    description:
      'Créez votre profil MotoPass avec Nostr Connect. Demandes via npub, alertes politiques et identité mobilité souveraine.',
    keywords: [
      'inscrire motopass', 'identité nostr', 'inscription npub',
      'identité souveraine', 'compte passeport bitcoin',
    ],
    h1: 'S\'inscrire avec Nostr',
  },
  '/dashboard': {
    title: 'Tableau de Bord — Centre de Commande Mobilité Souveraine',
    description:
      'Votre centre de commande MotoPass — alertes proactives, registre de documents, progression des demandes et outils souverains.',
    keywords: [
      'tableau bord motopass', 'tableau bord mobilité souveraine', 'suiveur demande',
      'registre documents', 'boîte de réception alertes',
    ],
    h1: 'Votre Tableau de Bord Souverain',
  },
  '/profile': {
    title: 'Profil — Votre Identité Mobilité Souveraine',
    description:
      'Gérez votre profil MotoPass lié à Nostr, documents horodatés et historique des demandes.',
    keywords: [
      'profil motopass', 'profil identité souveraine', 'profil nostr',
      'profil documents horodatés',
    ],
    h1: 'Votre Profil Souverain',
  },
}

// ── Portuguese ───────────────────────────────────────────────────────────────

const pt: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Passaportes Soberanos Bitcoin e Inteligência de Residência',
    description:
      'Avalie 50 programas de visto Bitcoin e visto dourado crypto com preços em ₿, provas Satohash e identidade Nostr. Verdade que você pode verificar.',
    keywords: ['passaporte bitcoin', 'passaporte soberano', 'visto dourado crypto', 'residência por investimento'],
    h1: 'Inteligência de Passaportes Soberanos Bitcoin',
  },
  '/programs': {
    title: '50 Programas de Visto Bitcoin e Visto Dourado Crypto — MotoPass',
    description: 'Explore 50 programas de passaporte soberano e visto Bitcoin — visto dourado crypto, residência por investimento com Lightning.',
    keywords: ['programas visto bitcoin', 'visto dourado crypto', 'residência por investimento', 'programas CBI'],
    h1: 'Programas de Residência e Cidadania — 50 Jurisdições',
  },
}

// ── Chinese ──────────────────────────────────────────────────────────────────

const zh: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — 比特币主权护照与居留情报',
    description: '评估50个比特币签证和加密黄金签证项目，₿定价、Satohash证明和Nostr身份。可验证的真相。',
    keywords: ['比特币护照', '主权护照', '加密黄金签证', '投资居留'],
    h1: '比特币原生主权护照情报',
  },
  '/programs': {
    title: '50个比特币签证与加密黄金签证项目 — MotoPass',
    description: '浏览50个主权护照和比特币签证项目——加密黄金签证、投资居留，Lightning就绪，₿成本，Satohash验证。',
    keywords: ['比特币签证项目', '加密黄金签证', '投资居留', 'CBI项目'],
    h1: '居留与公民身份项目 — 50个司法管辖区',
  },
}

// ── Arabic ───────────────────────────────────────────────────────────────────

const ar: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — جوازات السيادة Bitcoin والاستخبارات السكنية',
    description: 'قيّم 50 برنامج تأشيرة Bitcoin وتأشيرة ذهبية مشفرة مع تسعير ₿ وبراهين Satohash وهوية Nostr. حقيقة يمكنك التحقق منها.',
    keywords: ['جواز سفر بيتكوين', 'جواز سفر سيادي', 'تأشيرة ذهبية مشفرة', 'إقامة بالاستثمار'],
    h1: 'استخبارات جوازات السيادة البيتكوينية',
  },
  '/programs': {
    title: '50 برنامج تأشيرة بيتكوين وتأشيرة ذهبية مشفرة — MotoPass',
    description: 'تصفح 50 برنامج جواز سفر سيادي وتأشيرة بيتكوين — تأشيرة ذهبية مشفرة، إقامة بالاستثمار مع Lightning.',
    keywords: ['برامج تأشيرة بيتكوين', 'تأشيرة ذهبية مشفرة', 'إقامة بالاستثمار', 'برامج CBI'],
    h1: 'برامج الإقامة والجنسية — 50 ولاية قضائية',
  },
}

// ── Swahili ──────────────────────────────────────────────────────────────────

const sw: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Hatari za Uso wa Bitcoin na Taarifa za Kukaa',
    description: 'Tathmini programs 50 za kibali cha Bitcoin na kibali cha dhahabu ya crypto kwa bei za ₿, uthibitisho wa Satohash na utambulisho wa Nostr.',
    keywords: ['hatari ya bitcoin', 'hatari ya uso', 'kibali cha dhahabu ya crypto', 'kukaa kwa uwekezaji'],
    h1: 'Taarifa za Hatari za Uso wa Bitcoin',
  },
}

// ── German ───────────────────────────────────────────────────────────────────

const de: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — Bitcoin-Souveräne Pässe & Aufenthalts-Intelligenz',
    description: 'Bewerten Sie 50 Bitcoin-Visa- und Krypto-Golden-Visa-Programme mit ₿-Preisen, Satohash-Beweisen und Nostr-Identität.',
    keywords: ['Bitcoin-Reisepass', 'souveräner Reisepass', 'Krypto-Golden-Visa', 'Aufenthalt durch Investition'],
    h1: 'Bitcoin-native Souveräne Reisepass-Intelligenz',
  },
  '/programs': {
    title: '50 Bitcoin-Visa- & Krypto-Golden-Visa-Programme — MotoPass',
    description: 'Durchsuchen Sie 50 souveräne Reisepass- und Bitcoin-Visa-Programme — Krypto-Golden-Visa, RBI und CBI mit Lightning-Bereitschaft, ₿-Kosten und Satohash-Verifizierung.',
    keywords: ['Bitcoin-Visa-Programme', 'Krypto-Golden-Visa', 'Aufenthalt durch Investition', 'CBI-Programme'],
    h1: 'Aufenthalts- & Bürgerrechtsprogramme — 50 Jurisdiktionen',
  },
}

// ── Hindi ────────────────────────────────────────────────────────────────────

const hi: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — बिटकॉइन संप्रभु पासपोर्ट और निवास बुद्धिमत्ता',
    description: '50 बिटकॉइन वीज़ा और क्रिप्टो गोल्डन वीज़ा कार्यक्रमों का मूल्यांकन करें — ₿ मूल्य निर्धारण, Satohash प्रमाण और Nostr पहचान।',
    keywords: ['बिटकॉइन पासपोर्ट', 'संप्रभु पासपोर्ट', 'क्रिप्टो गोल्डन वीज़ा', 'निवास निवेश द्वारा'],
    h1: 'बिटकॉइन-नेटिव संप्रभु पासपोर्ट बुद्धिमत्ता',
  },
}

// ── Japanese ─────────────────────────────────────────────────────────────────

const ja: RouteSeoKeywords = {
  '/': {
    title: 'MotoPass — ビットコイン主権パスポート＆居住インテリジェンス',
    description: '50のビットコインビザと暗号ゴールデンビザプログラムを₿プライシング、Satohash証明、Nostr IDで評価。検証可能な真実。',
    keywords: ['ビットコインパスポート', '主権パスポート', '暗号ゴールデンビザ', '投資居住'],
    h1: 'ビットコインネイティブ主権パスポートインテリジェンス',
  },
  '/programs': {
    title: '50のビットコインビザ＆暗号ゴールデンビザプログラム — MotoPass',
    description: '50の主権パスポートとビットコインビザプログラムを閲覧 — Lightning対応、₿コスト、Satohash検証。',
    keywords: ['ビットコインビザプログラム', '暗号ゴールデンビザ', '投資居住', 'CBIプログラム'],
    h1: '居住・市民権プログラム — 50の法域',
  },
}

// ── Export merged map ────────────────────────────────────────────────────────

export const SEO_KEYWORDS: Record<LangCode, RouteSeoKeywords> = {
  en, es, fr, pt, zh, ar, sw, de, hi, ja,
}

/** Get SEO keywords for a route and language, falling back to English. */
export function getSeoKeywords(
  route: string,
  lang: LangCode,
): SeoKeywords {
  const langMap = SEO_KEYWORDS[lang]
  if (langMap?.[route]) return langMap[route]
  // Fallback to English
  return SEO_KEYWORDS.en[route] ?? {
    title: 'MotoPass',
    description: 'Bitcoin-native sovereign passport and residency intelligence.',
    keywords: ['bitcoin passport', 'sovereign mobility'],
    h1: 'MotoPass',
  }
}
