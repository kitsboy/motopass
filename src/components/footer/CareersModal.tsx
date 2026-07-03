import { Briefcase, MapPin, Mail, ChevronRight } from 'lucide-react'
import { ClassyModal } from '../ui/ClassyModal'
import { CAREERS_EMAIL, JOB_POSTINGS, jobMailto } from '../../data/careers'

type Props = { open: boolean; onClose: () => void }

export function CareersModal({ open, onClose }: Props) {
  return (
    <ClassyModal
      open={open}
      onClose={onClose}
      title="Join MotoPass"
      subtitle={`7 open roles · Apply via ${CAREERS_EMAIL}`}
      icon={<Briefcase size={20} />}
      maxWidth="xl"
    >
      <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
        Email <strong className="text-ink">hello@giveabit.io</strong> with subject line{' '}
        <code className="text-xs bg-section px-1.5 py-0.5 rounded-mp-sm border border-mp font-mono">
          Motopass job - [Position]
        </code>{' '}
        — we route by subject to stay organized.
      </p>

      <div className="space-y-4">
        {JOB_POSTINGS.map(job => (
          <article key={job.id} className="card-muted hover:border-btc-orange/25 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display font-semibold text-base text-ink">{job.title}</h3>
                <p className="text-xs text-btc-orange-deep font-mono mt-0.5">{job.department}</p>
              </div>
              <a
                href={jobMailto(job)}
                className="btn-primary text-xs py-2 px-4 shrink-0 inline-flex items-center gap-1.5"
              >
                <Mail size={14} /> Apply
              </a>
            </div>
            <p className="text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-1 mb-3">
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
              <span>{job.type}</span>
            </p>
            <p className="text-sm text-ink-secondary mb-3 leading-relaxed">{job.summary}</p>
            <details className="group text-xs">
              <summary className="cursor-pointer text-btc-orange font-medium flex items-center gap-1 list-none">
                <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                Full description
              </summary>
              <div className="mt-3 space-y-3 pl-5 border-l-2 border-btc-orange/20">
                <div>
                  <div className="font-semibold text-ink mb-1">Responsibilities</div>
                  <ul className="text-ink-secondary space-y-1 list-disc pl-4">
                    {job.responsibilities.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-ink mb-1">Requirements</div>
                  <ul className="text-ink-secondary space-y-1 list-disc pl-4">
                    {job.requirements.map(r => <li key={r}>{r}</li>)}
                  </ul>
                </div>
                {job.niceToHave && (
                  <div>
                    <div className="font-semibold text-ink mb-1">Nice to have</div>
                    <ul className="text-ink-secondary space-y-1 list-disc pl-4">
                      {job.niceToHave.map(r => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </article>
        ))}
      </div>
    </ClassyModal>
  )
}