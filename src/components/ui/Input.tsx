import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: boolean
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: boolean
}

export function Input({ label, hint, error, id, className = '', ...props }: InputProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="font-chrome text-xs font-medium text-ink-muted block">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        aria-invalid={error || undefined}
        className={`input-field ${error ? 'input-field-error' : ''} ${className}`.trim()}
        {...props}
      />
      {hint && <p className="text-[10px] text-ink-muted font-mono opacity-75">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, hint, error, id, className = '', rows = 3, ...props }: TextareaProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="font-chrome text-xs font-medium text-ink-muted block">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error || undefined}
        className={`input-field resize-y ${error ? 'input-field-error' : ''} ${className}`.trim()}
        {...props}
      />
      {hint && <p className="text-[10px] text-ink-muted font-mono opacity-75">{hint}</p>}
    </div>
  )
}

export function Select({
  label,
  error,
  id,
  className = '',
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { label?: string; error?: boolean; children: ReactNode }) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="font-chrome text-xs font-medium text-ink-muted block">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        aria-invalid={error || undefined}
        className={`select-field ${error ? 'input-field-error' : ''} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}