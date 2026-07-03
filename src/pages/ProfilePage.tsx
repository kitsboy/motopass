import { Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { FileUpload, type UploadItem } from '../components/beui/FileUpload'
import { hashApplicationPayload, satohashStampGuideUrl } from '../lib/satohash'
import type { UserDocument } from '../types/user'
import { AnimatedBadge } from '../components/beui/AnimatedBadge'
import { PageHeader } from '../components/ui/PageHeader'

export function ProfilePage() {
  const { profile, isLoggedIn, setProfile } = useUser()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])

  if (!isLoggedIn || !profile) return <Navigate to="/register" replace />

  const handleFileAdded = async (item: UploadItem) => {
    const hash = await hashApplicationPayload({ name: item.name, size: item.size, npub: profile.npub, program: profile.program })
    const satohashUrl = satohashStampGuideUrl(hash)
    const doc: UserDocument = { id: item.id, name: item.name, size: item.size, type: item.type, hash, satohashUrl, stampedAt: new Date().toISOString(), status: 'hashed' }
    setUploadItems(uploadItems.map(u => u.id === item.id ? { ...u, progress: 100, status: 'success' as const, hash, satohashUrl } : u))
    const docCount = profile.documents.length + 1
    setProfile({ ...profile, documents: [...profile.documents, doc], status: docCount >= 2 ? 'stamped' : 'documents', agentId: 'kimi', agentName: 'Kimi' })
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto">
      <PageHeader
        eyebrow="PROFILE & DOCUMENTS"
        title="Your documents"
        subtitle="Upload passport documents. Each file is SHA-256 hashed and ready for Satohash.io stamping — files never leave your device."
      />

      <div className="flex gap-2 mb-6">
        <AnimatedBadge status="info">{profile.program}</AnimatedBadge>
        <AnimatedBadge status="neutral">{profile.documents.length} docs</AnimatedBadge>
      </div>

      <FileUpload items={uploadItems} onItemsChange={setUploadItems} onFileAdded={handleFileAdded} />

      {profile.documents.length > 0 && (
        <div className="mt-8 card">
          <h3 className="font-display font-semibold text-ink mb-4">Stamped document hashes</h3>
          <ul className="space-y-3">
            {profile.documents.map(d => (
              <li key={d.id} className="text-sm border-b border-mp pb-3 last:border-0">
                <div className="font-medium text-ink">{d.name}</div>
                <code className="text-[10px] text-btc-orange-deep font-mono break-all">{d.hash}</code>
                <a href={d.satohashUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-btc-orange font-medium hover:underline block mt-1">
                  Stamp on Satohash.io →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/dashboard" className="btn-secondary w-full mt-6 text-center block">← Back to dashboard</Link>
    </div>
  )
}