import {mockRedwoodDirective, getDirectiveName} from '@redwoodjs/testing/api'
import {merge} from 'lodash'
import {CurrentUser} from 'src/lib/auth'

import requireAuth from './requireAuth'

const user: NonNullable<CurrentUser> = {
  user: {
    id: 1,
    ethereumAddress: '0x1',
    email: null,
    roles: [],
  },
  registrationAttempt: null,
  cachedProfile: null,
}

describe('requireAuth directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    expect(requireAuth.schema).toBeTruthy()
    expect(getDirectiveName(requireAuth.schema)).toBe('requireAuth')
  })

  it('should throw if no user is present', () => {
    const mockExecution = mockRedwoodDirective(requireAuth, {
      context: {},
    })

    expect(mockExecution).toThrowError()
  })

  it('should not throw when current user', () => {
    const mockExecution = mockRedwoodDirective(requireAuth, {
      context: {currentUser: user},
    })

    expect(mockExecution).not.toThrowError()
  })

  it('should only allow users with the selected roles', () => {
    const notaryUser = merge({}, user, {user: {roles: ['NOTARY']}})
    const executeRequireNotary = mockRedwoodDirective(requireAuth, {
      context: {currentUser: notaryUser},
      directiveArgs: {roles: ['NOTARY']},
    })

    const executeRequireAdmin = mockRedwoodDirective(requireAuth, {
      context: {currentUser: notaryUser},
      directiveArgs: {roles: ['ADMIN']},
    })

    expect(executeRequireNotary).not.toThrowError()
    expect(executeRequireAdmin).toThrowError()
  })
})
