import {mockRedwoodDirective, getDirectiveName} from '@redwoodjs/testing/api'

import validateAddress from './validateAddress'

describe('validateAddress directive', () => {
  it('declares the directive sdl as schema, with the correct name', () => {
    expect(validateAddress.schema).toBeTruthy()
    expect(getDirectiveName(validateAddress.schema)).toBe('validateAddress')
  })

  it('passes correctly-formed ethereum addresses with checksum', () => {
    const mockExecution = mockRedwoodDirective(validateAddress, {
      mockedResolvedValue: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
    })

    expect(mockExecution()).toBe('0x334230242D318b5CA159fc38E07dC1248B7b35e4')
  })

  it('formats correctly-formed ethereum addresses without checksum', () => {
    const mockExecution = mockRedwoodDirective(validateAddress, {
      mockedResolvedValue: '0x334230242d318b5ca159fc38e07dc1248b7b35e4',
    })

    expect(mockExecution()).toBe('0x334230242D318b5CA159fc38E07dC1248B7b35e4')
  })

  it('fails ethereum addresses with an invalid checksum', () => {
    const mockExecution = mockRedwoodDirective(validateAddress, {
      mockedResolvedValue: '0x334230242D318b5CA159fc38E07dC1248B7b35E4',
    })

    expect(mockExecution).toThrowError()
  })

  it('fails for random non-address-like strings', () => {
    const mockExecution = mockRedwoodDirective(validateAddress, {
      mockedResolvedValue:
        'put on your sunday clothes when you feel down and out!',
    })

    expect(mockExecution).toThrowError()
  })
})
