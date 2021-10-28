import { cachedProfiles } from './cachedProfiles'
import type { StandardScenario } from './cachedProfiles.scenarios'

describe('cachedProfiles', () => {
  scenario('returns all cachedProfiles', async (scenario: StandardScenario) => {
    const result = await cachedProfiles()

    expect(result.length).toEqual(Object.keys(scenario.cachedProfile).length)
  })
})
