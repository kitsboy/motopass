import { Keyboard } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useI18n } from '../../i18n/I18nContext'

type Props = {
  open: boolean
  onClose: () => void
}

type ShortcutRow = {
  keys: string
  labelKey: 'nav.shortcuts.language' | 'nav.shortcuts.help' | 'nav.shortcuts.close' | 'nav.shortcuts.programs'
}

const ROWS: ShortcutRow[] = [
  { keys: '⌘L / Ctrl+L', labelKey: 'nav.shortcuts.language' },
  { keys: 'g p', labelKey: 'nav.shortcuts.programs' },
  { keys: '?', labelKey: 'nav.shortcuts.help' },
  { keys: 'Esc', labelKey: 'nav.shortcuts.close' },
]

export function NavShortcutsModal({ open, onClose }: Props) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('nav.shortcuts.title')}
      subtitle={t('nav.shortcuts.subtitle')}
      eyebrow={t('nav.tools')}
      icon={<Keyboard size={22} strokeWidth={2.25} />}
      maxWidth="md"
      closeLabel={t('nav.close')}
    >
      <ul className="space-y-2">
        {ROWS.map(row => (
          <li
            key={row.labelKey}
            className="flex items-center justify-between gap-4 rounded-xl border border-mp/50 bg-section/40 px-3.5 py-2.5"
          >
            <span className="text-sm text-ink-secondary">{t(row.labelKey)}</span>
            <kbd className="shortcut-kbd shrink-0">{row.keys}</kbd>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl border border-mp/40 bg-section/30 px-3.5 py-2.5 text-xs text-ink-muted leading-relaxed">
        {t('nav.shortcuts.footerGap')}
      </p>
    </Modal>
  )
}