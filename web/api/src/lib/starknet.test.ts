import { exportProfileById } from './starknet'

describe('export_profile_by_id', () => {
  test('retrieves a profile', async () => {
    const profile = await exportProfileById('0x1')
    console.log({ profile })
  })
})
