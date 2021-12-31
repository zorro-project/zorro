import {exportProfileById} from './starknet'

describe('export_profile_by_id', () => {
  test.skip('retrieves a profile', async () => {
    const profile = await exportProfileById(1)
    console.log({profile})
  })
})
