import {useLocation} from '@redwoodjs/router'
import posthog from 'posthog-js'
import {useEffect} from 'react'

const ENABLE_POSTHOG =
  process.env.CHAIN_DEPLOYMENT === 'staging' ||
  process.env.CHAIN_DEPLOYMENT === 'production'

if (ENABLE_POSTHOG) {
  posthog.init('phc_RcuJ2vuMYm2SeT0eD2jq3LhzmAn4pOMG4hNt32SSvwe', {
    api_host: 'https://posthog.zorro.xyz',
    autocapture: false,
  })
}

export const track = (eventName: string, properties?: posthog.Properties) =>
  ENABLE_POSTHOG && posthog?.capture?.(eventName, properties)

export const useTrackOnMount = (
  eventName: string,
  properties?: posthog.Properties
) => {
  useEffect(() => {
    track(eventName, properties)
  }, [])
}

export const PosthogManager = () => {
  const {pathname} = useLocation()

  useEffect(() => {
    track('$pageview')
  }, [pathname])
  return null
}
