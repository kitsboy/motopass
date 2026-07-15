import { Helmet } from 'react-helmet-async'
import { DEFAULT_OG_IMAGE, SITE_NAME, formatPageTitle, absoluteUrl, localizedUrl } from '../lib/seo'
import { LANGUAGES, type LangCode } from '../i18n/languages'

type JsonLd = Record<string, unknown> | Record<string, unknown>[]

type SeoHeadProps = {
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
  jsonLd?: JsonLd
  /** When true, only inject JSON-LD (route meta handled elsewhere). */
  jsonLdOnly?: boolean
  /** hreflang alternates — defaults to all supported locales. */
  hrefLangs?: LangCode[]
}

export function SeoHead({
  title = '',
  description = '',
  path = '/',
  noIndex = false,
  jsonLd,
  jsonLdOnly = false,
  hrefLangs,
}: SeoHeadProps) {
  if (jsonLdOnly) {
    if (!jsonLd) return null
    return (
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
    )
  }

  const pageTitle = formatPageTitle(title)
  const url = absoluteUrl(path)
  const alternates = (hrefLangs ?? LANGUAGES.map((l) => l.code)).map((code) => {
    const meta = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
    return { code: meta.code, href: localizedUrl(path, meta.code) }
  })

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {alternates.map((alt) => (
        <link key={alt.code} rel="alternate" hrefLang={alt.code} href={alt.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  )
}