import { useI18n } from '../../i18n/I18nContext'

/** Homepage hero tagline — exact brand copy, one line each, no periods. */
export function PitchHeroTagline() {
  const { t, lang } = useI18n()
  const jp = lang === 'ja'
  return (
    <h1
      className="hero-elite-tagline font-display"
      aria-label={t('pitch.heroTaglineAria')}
    >
      <span className="hero-elite-tagline__line hero-elite-tagline__line--lead">
        {t('pitch.heroTagline.line1')}
      </span>
      <span className="hero-elite-tagline__line hero-elite-tagline__line--stamp">
        {t('pitch.heroTagline.line2prefix')}
        <span className="hero-elite-tagline__accent">{t('pitch.heroTagline.line2accent')}</span>
      </span>
      <span className="hero-elite-tagline__line hero-elite-tagline__line--finale">
        {jp ? (
          <>
            <span className="hero-elite-tagline__struck">{t('pitch.heroTagline.line3struck')}</span>
            <span className="hero-elite-tagline__neg">{t('pitch.heroTagline.line3neg')}</span>
          </>
        ) : (
          <>
            <span className="hero-elite-tagline__neg">{t('pitch.heroTagline.line3neg')}</span>{' '}
            <span className="hero-elite-tagline__struck">{t('pitch.heroTagline.line3struck')}</span>
          </>
        )}
      </span>
    </h1>
  )
}
