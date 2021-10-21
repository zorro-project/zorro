import { notaryFeedbacks } from './notaryFeedbacks'
import type { StandardScenario } from './notaryFeedbacks.scenarios'

describe('notaryFeedbacks', () => {
  scenario(
    'returns all notaryFeedbacks',
    async (scenario: StandardScenario) => {
      const result = await notaryFeedbacks()

      expect(result.length).toEqual(Object.keys(scenario.notaryFeedback).length)
    }
  )
})
