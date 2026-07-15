import type { MutableRefObject } from 'react'
import { Scale } from 'lucide-react'
import { ClassyModal } from '../ui/ClassyModal'
import { LEGAL_LAST_UPDATED, LEGAL_SECTIONS, LEGAL_VERSION } from '../../data/legal'

type Props = {
  open: boolean
  onClose: () => void
  returnFocusRef?: MutableRefObject<HTMLElement | null>
}

export function LegalModal({ open, onClose, returnFocusRef }: Props) {
  return (
    <ClassyModal
      open={open}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title="Terms & EU Liability"
      subtitle={`No data collection · Not accepting applications · ${LEGAL_VERSION}`}
      icon={<Scale size={20} />}
      maxWidth="xl"
    >
      <p className="text-xs text-ink-muted font-mono mb-6 pb-4 border-b border-mp">
        Last updated {LEGAL_LAST_UPDATED} · For EU/EEA/UK users · Not legal advice
      </p>
      <div className="space-y-6">
        {LEGAL_SECTIONS.map(s => (
          <section key={s.id}>
            <h3 className="font-display font-semibold text-sm text-ink mb-2">{s.title}</h3>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
              {s.body.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={i} className="text-ink font-medium">{part.slice(2, -2)}</strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>
          </section>
        ))}
      </div>
      <p className="mt-8 pt-4 border-t border-mp text-[10px] text-ink-muted font-mono">
        By using MotoPass you acknowledge these terms. Material changes will update BUILD version in footer.
      </p>
    </ClassyModal>
  )
}