import { useState } from 'react'
import { Server, Zap, Bitcoin } from 'lucide-react'
import { ClassyModal } from '../ui/ClassyModal'
import { ModalTabs } from '../ui/ModalTabs'
import { CopyField } from '../ui/CopyField'
import { PaymentQrCode } from '../ui/PaymentQrCode'
import { SERVER_COSTS } from '../../data/serverCosts'

type Tab = 'layer1' | 'layer2'
type Props = { open: boolean; onClose: () => void }

export function ServerCostsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('layer1')
  const active = tab === 'layer1' ? SERVER_COSTS.layer1 : SERVER_COSTS.layer2

  return (
    <ClassyModal
      open={open}
      onClose={onClose}
      title="Server Costs"
      subtitle="Voluntary tips offset hosting, research CDN, and stamping infra"
      icon={<Server size={20} />}
      maxWidth="md"
    >
      <ModalTabs<Tab>
        tabs={[
          { id: 'layer1', label: 'Layer 1', hint: 'Bitcoin on-chain' },
          { id: 'layer2', label: 'Layer 2', hint: 'Lightning' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="flex items-center gap-2 mb-4">
        {tab === 'layer1' ? <Bitcoin size={18} className="text-btc-orange" /> : <Zap size={18} className="text-btc-orange" />}
        <span className="font-display font-semibold text-ink">{active.label}</span>
        {'temp' in active && active.temp && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            TEMP
          </span>
        )}
      </div>

      <p className="text-sm text-ink-secondary mb-6 leading-relaxed">{active.description}</p>

      <div className="mb-6">
        <PaymentQrCode
          value={active.qrPayload}
          label={tab === 'layer1' ? 'Layer 1 · Bitcoin' : 'Layer 2 · Lightning'}
          temp={'temp' in active && active.temp}
        />
      </div>

      <CopyField
        label={tab === 'layer1' ? 'On-chain address (bech32)' : 'Lightning address (TEMP)'}
        value={active.address}
      />

      <p className="mt-5 text-[10px] text-ink-muted font-mono leading-relaxed">
        Not a MiCA token sale. No goods or services guaranteed. Thank you for supporting sovereign infrastructure.
      </p>
    </ClassyModal>
  )
}