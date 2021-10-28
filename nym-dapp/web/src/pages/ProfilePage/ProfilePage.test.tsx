import { render } from '@redwoodjs/testing/web'

import ProfilePage from './ProfilePage'

describe('ProfilePage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ProfilePage />)
    }).not.toThrow()
  })
})
