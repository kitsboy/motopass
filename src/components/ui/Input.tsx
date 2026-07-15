import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
}

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="font-chrome text-xs font-medium text-ink-muted block">
          {label}
        </label>
      )}
      <input id={fieldId} className={`input-field ${className}`.trim()} {...props} />
      {hint && <p className="text-[10px] text-ink-muted font-mono opacity-75">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, hint, id, className = '', rows = 3, ...props }: TextareaProps) {
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
        className={`input-field resize-y ${className}`.trim()}
        {...props}
      />
      {hint && <p className="text-[10px] text-ink-muted font-mono opacity-75">{hint}</p>}
    </div>
  )
}

export function Select({
  label,
  id,
  className = '',
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="font-chrome text-xs font-medium text-ink-muted block">
          {label}
        </label>
      )}
      <select id={fieldId} className={`select-field ${className}`.trim()} {...props}>
        {children}
      </select>
    </div>
  )
}