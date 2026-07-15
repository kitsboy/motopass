import type { ReactNode } from 'react'
import { Modal, type ModalProps } from './Modal'

type Props = Omit<ModalProps, never> & { children: ReactNode }

/** @deprecated Prefer `Modal` — kept for backward compatibility */
export function ClassyModal(props: Props) {
  return <Modal {...props} />
}