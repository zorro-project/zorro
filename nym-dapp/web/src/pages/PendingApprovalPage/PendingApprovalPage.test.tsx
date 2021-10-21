import { render } from '@redwoodjs/testing/web'

import PendingApprovalPage from './PendingApprovalPage'

describe('PendingApprovalPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PendingApprovalPage />)
    }).not.toThrow()
  })
})
