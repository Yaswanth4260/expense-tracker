import type { ButtonHTMLAttributes, ReactNode } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }

export function PrimaryButton({ children, className = '', ...props }: PrimaryButtonProps) {
  return <button className={`ui-button ui-button-primary ${className}`.trim()} {...props}>{children}</button>
}
