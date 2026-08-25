import type { ButtonHTMLAttributes, ReactNode } from 'react'

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }

export function SecondaryButton({ children, className = '', ...props }: SecondaryButtonProps) {
  return <button className={`ui-button ui-button-secondary ${className}`.trim()} {...props}>{children}</button>
}
