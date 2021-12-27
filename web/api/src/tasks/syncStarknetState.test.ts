import {readCIDs} from './syncStarknetState'
import {Prisma} from '@prisma/client'
import {parseCid} from 'src/lib/starknet'

describe('readCIDs', () => {
  test('correctly parses a CID', async () => {
    const cid = parseCid(
      '0x0170121be2bfe156987787cd2a79fc49842d0a2143d728f46a28cfd6a31bda'
    )

    expect(await readCIDs(cid)).toEqual({
      photoCID: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
      videoCID: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
    })
  })
})

// describe('')
