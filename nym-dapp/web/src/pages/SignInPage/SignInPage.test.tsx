import { render } from '@redwoodjs/testing/web'

import SignInPage from './SignInPage'

describe('SignInPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<SignInPage />)
    }).not.toThrow()
  })
})
