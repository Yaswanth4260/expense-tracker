import type { ReactNode } from 'react'

type Segment<T extends string> = { value: T; label: ReactNode }
type SegmentedControlProps<T extends string> = { value: T; options: Segment<T>[]; onChange: (value: T) => void; label?: string }

export function SegmentedControl<T extends string>({ value, options, onChange, label = 'Choose an option' }: SegmentedControlProps<T>) {
  return <div className="ui-segmented-control" role="group" aria-label={label}>{options.map((option) => <button type="button" className={option.value === value ? 'selected' : ''} key={option.value} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>
}
