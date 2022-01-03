import {parseAddress} from './serializers'

describe('parseAddress', () => {
  test('parses even-length addresses to a canonical form', () => {
    expect(parseAddress('0xabcd')).toEqual('0xabcd')
    expect(parseAddress('0x0abcd')).toEqual('0xabcd')
    expect(parseAddress('0x00abcd')).toEqual('0xabcd')
    expect(parseAddress('0x000abcd')).toEqual('0xabcd')
  })

  test('parses odd-length addresses to a canonical form', () => {
    expect(parseAddress('0xabc')).toEqual('0x0abc')
    expect(parseAddress('0x0abc')).toEqual('0x0abc')
    expect(parseAddress('0x00abc')).toEqual('0x0abc')
    expect(parseAddress('0x000abc')).toEqual('0x0abc')
  })

  test('parses a null address', () => {
    expect(parseAddress('0x0')).toEqual(null)
    expect(parseAddress(null)).toEqual(null)
  })
})
