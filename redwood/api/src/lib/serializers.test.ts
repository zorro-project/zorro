import {parseStarknetAddress, parseEthereumAddress} from './serializers'

describe('parseStarknetAddress', () => {
  test('parses even-length addresses to a canonical form', () => {
    expect(parseStarknetAddress('0xabcd')).toEqual('0xabcd')
    expect(parseStarknetAddress('0x0abcd')).toEqual('0xabcd')
    expect(parseStarknetAddress('0x00abcd')).toEqual('0xabcd')
    expect(parseStarknetAddress('0x000abcd')).toEqual('0xabcd')
  })

  test('parses odd-length addresses to a canonical form', () => {
    expect(parseStarknetAddress('0xabc')).toEqual('0x0abc')
    expect(parseStarknetAddress('0x0abc')).toEqual('0x0abc')
    expect(parseStarknetAddress('0x00abc')).toEqual('0x0abc')
    expect(parseStarknetAddress('0x000abc')).toEqual('0x0abc')
  })

  test('parses a null address', () => {
    expect(parseStarknetAddress('0x0')).toEqual(null)
    // expect(parseStarknetAddress(null)).toEqual(null)
  })
})

describe('parseEthereumAddress', () => {
  test('parses addresses to a canonical form', () => {
    expect(parseEthereumAddress('0xabcd')).toEqual(
      '0x000000000000000000000000000000000000ABcD'
    )
    expect(
      parseEthereumAddress('0x334230242D318b5CA159fc38E07dC1248B7b35e4')
    ).toEqual('0x334230242D318b5CA159fc38E07dC1248B7b35e4')
  })

  test('rejects invalid addresses', () => {
    // Address can't be more than 40 characters
    expect(
      parseEthereumAddress('0x334230242D318b5CA159fc38E07dC1248B7b35e40000')
    ).toEqual(null)
  })

  test('parses a null address', () => {
    expect(parseEthereumAddress('0x0')).toEqual(null)
    // expect(parseEthereumAddress(null)).toEqual(null)
  })
})
