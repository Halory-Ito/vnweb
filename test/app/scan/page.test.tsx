import { render } from 'vitest-browser-react'

import Scan from '@/app/scan/page'

it.skip('Page', async () => {
  const { getByRole } = await render(<Scan />)
  const h = getByRole('heading', { level: 1, name: 'Scan' })
  expect(h).toBeDefined()
})
