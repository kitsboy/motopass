import { useState } from 'react'
import { Scale, Briefcase, Server } from 'lucide-react'
import { FooterModalButton } from './FooterModalButton'
import { LegalModal } from './LegalModal'
import { CareersModal } from './CareersModal'
import { ServerCostsModal } from './ServerCostsModal'

export function FooterActionBar() {
  const [legal, setLegal] = useState(false)
  const [careers, setCareers] = useState(false)
  const [server, setServer] = useState(false)

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-10">
        <FooterModalButton
          icon={<Scale size={18} />}
          label="Terms & Liability"
          sub="EU legal"
          onClick={() => setLegal(true)}
        />
        <FooterModalButton
          icon={<Briefcase size={18} />}
          label="Careers"
          sub="7 roles"
          onClick={() => setCareers(true)}
        />
        <FooterModalButton
          icon={<Server size={18} />}
          label="Server Costs"
          sub="BTC · LN"
          onClick={() => setServer(true)}
        />
      </div>

      <LegalModal open={legal} onClose={() => setLegal(false)} />
      <CareersModal open={careers} onClose={() => setCareers(false)} />
      <ServerCostsModal open={server} onClose={() => setServer(false)} />
    </>
  )
}