import '../../config/tests'
import { getProfile } from './starknet'

describe('get_profile', () => {
  test('retrieves a profile', async () => {
    const profile = await getProfile('0x1')
    console.log({ profile })
  })
})
