import { render } from '@redwoodjs/testing/web'

import SignUpPage from './SignUpPage'

describe('SignUpPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<SignUpPage />)
    }).not.toThrow()
  })
})
