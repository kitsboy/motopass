import { useCallback, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Link2 } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { PITCH_FAQ_KEYS, pitchFaqAnchorId } from '../../lib/pitchFaq'
import type { TranslationKey } from '../../i18n/translations'

type PitchFaqAccordionProps = {
  eyebrow: string
  title: string
}

/** FAQ accordion with arrow-key navigation and focus trap while a panel is open. */
export function PitchFaqAccordion({ eyebrow, title }: PitchFaqAccordionProps) {
  const { t } = useI18n()
  const baseId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useFocusTrap(containerRef, openIndex !== null, () => setOpenIndex(null))

  const toggle = useCallback((index: number) => {
    setOpenIndex(prev => (prev === index ? null : index))
  }, [])

  const focusTrigger = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(PITCH_FAQ_KEYS.length - 1, index))
    triggerRefs.current[clamped]?.focus()
  }, [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          focusTrigger(index + 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          focusTrigger(index - 1)
          break
        case 'Home':
          e.preventDefault()
          focusTrigger(0)
          break
        case 'End':
          e.preventDefault()
          focusTrigger(PITCH_FAQ_KEYS.length - 1)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          toggle(index)
          break
        default:
          break
      }
    },
    [focusTrigger, toggle],
  )

  return (
    <section id="pitch-faq" className="px-4 sm:px-6 py-14 sm:py-16 max-w-3xl mx-auto scroll-mt-header">
      <span className="club-eyebrow block mb-3">{eyebrow}</span>
      <h2 className="font-display text-h2 font-semibold text-ink mb-8">{title}</h2>

      <div
        ref={containerRef}
        className="space-y-3"
        role="region"
        aria-label={title}
      >
        {PITCH_FAQ_KEYS.map(({ q, a }: { q: TranslationKey; a: TranslationKey }, index) => {
          const open = openIndex === index
          const triggerId = `${baseId}-trigger-${index}`
          const panelId = `${baseId}-panel-${index}`

          const anchorId = pitchFaqAnchorId(index)

          return (
            <div
              key={q}
              id={anchorId}
              className="rounded-card border border-mp/60 bg-card/80 overflow-hidden scroll-mt-header"
            >
              <h3 className="m-0">
                <div className="flex items-stretch">
                  <button
                    ref={el => {
                      triggerRefs.current[index] = el
                    }}
                    id={triggerId}
                    type="button"
                    className="flex flex-1 items-center justify-between gap-4 px-5 py-4 text-left font-display font-semibold text-ink transition-colors hover:bg-section/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-btc-orange"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    onKeyDown={e => onKeyDown(e, index)}
                  >
                    <span>{t(q)}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-ink-muted transition-transform duration-base ${open ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <a
                    href={`#${anchorId}`}
                    className="shrink-0 self-center mr-3 rounded-lg p-2 text-ink-muted hover:text-mp-btc-text hover:bg-section/60 transition-colors"
                    aria-label={`${t(q)} — permalink`}
                    title="Copy link to this question"
                    onClick={e => e.stopPropagation()}
                  >
                    <Link2 size={14} aria-hidden />
                  </a>
                </div>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!open}
                className={open ? 'px-5 pb-5' : 'hidden'}
              >
                <p className="text-sm text-ink-secondary leading-relaxed">{t(a)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}