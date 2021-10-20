import { render } from '@redwoodjs/testing/web'

import PendingProfilePage from './PendingProfilePage'

describe('PendingProfilePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PendingProfilePage />)
    }).not.toThrow()
  })
})
