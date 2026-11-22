import type { ComponentProps } from 'react'

export default function AppearanceColorInput(
  props: Omit<ComponentProps<'input'>, 'type' | 'className'>,
) {
  return (
    <input {...props} type="color" className="border-input h-8 w-8 cursor-pointer rounded border" />
  )
}
