import { render } from '@redwoodjs/testing/web'

import UnsubmittedProfilesPage from './UnsubmittedProfilesPage'

describe('UnsubmittedProfilesPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<UnsubmittedProfilesPage />)
    }).not.toThrow()
  })
})
