import {parseCid} from '../serializers'
import parseProfileCid from './parseProfileCid'

describe('parseProfileCid', () => {
  test.skip('correctly parses a cid', async () => {
    const cid = parseCid(
      '0x0170121be2bfe156987787cd2a79fc49842d0a2143d728f46a28cfd6a31bda'
    )

    expect(await parseProfileCid(cid)).toEqual({
      photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
      videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
    })
  })
})
