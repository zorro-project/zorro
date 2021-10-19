import {
  unsubmittedProfiles,
  unsubmittedProfile,
  createUnsubmittedProfile,
  updateUnsubmittedProfile,
  deleteUnsubmittedProfile,
} from './unsubmittedProfiles'
import type { StandardScenario } from './unsubmittedProfiles.scenarios'

describe('unsubmittedProfiles', () => {
  scenario(
    'returns all unsubmittedProfiles',
    async (scenario: StandardScenario) => {
      const result = await unsubmittedProfiles()

      expect(result.length).toEqual(
        Object.keys(scenario.unsubmittedProfile).length
      )
    }
  )

  scenario(
    'returns a single unsubmittedProfile',
    async (scenario: StandardScenario) => {
      const result = await unsubmittedProfile({
        id: scenario.unsubmittedProfile.one.id,
      })

      expect(result).toEqual(scenario.unsubmittedProfile.one)
    }
  )

  scenario('creates a unsubmittedProfile', async () => {
    const result = await createUnsubmittedProfile({
      input: {
        selfieCID: 'String',
        videoCID: 'String',
        ethAddress: 'String',
        updatedAt: '2021-10-19T14:11:15Z',
      },
    })

    expect(result.selfieCID).toEqual('String')
    expect(result.videoCID).toEqual('String')
    expect(result.ethAddress).toEqual('String')
    expect(result.updatedAt).toEqual('2021-10-19T14:11:15Z')
  })

  scenario(
    'updates a unsubmittedProfile',
    async (scenario: StandardScenario) => {
      const original = await unsubmittedProfile({
        id: scenario.unsubmittedProfile.one.id,
      })
      const result = await updateUnsubmittedProfile({
        id: original.id,
        input: { selfieCID: 'String2' },
      })

      expect(result.selfieCID).toEqual('String2')
    }
  )

  scenario(
    'deletes a unsubmittedProfile',
    async (scenario: StandardScenario) => {
      const original = await deleteUnsubmittedProfile({
        id: scenario.unsubmittedProfile.one.id,
      })
      const result = await unsubmittedProfile({ id: original.id })

      expect(result).toEqual(null)
    }
  )
})
