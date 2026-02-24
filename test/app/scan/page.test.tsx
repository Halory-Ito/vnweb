import Scan from '@/app/scan/page'
import { render } from 'vitest-browser-react'

it('Page', async () => {
  const { getByRole } = await render(<Scan />)
  const h = getByRole('heading', { level: 1, name: 'Scan' })
  expect(h).toBeDefined()
})
