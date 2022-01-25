import {routes} from '@redwoodjs/router'
import {requestMediaPermissions} from 'mic-check'
import {useEffect} from 'react'
import {useGuard} from 'src/lib/useGuard'
import {useUser} from 'src/layouts/UserContext'
import {appNav} from 'src/lib/util'

export const requireWalletConnected = () => {
  const {ethereumAddress} = useUser()
  useGuard(ethereumAddress, routes.registerIntro())
  return ethereumAddress
}

export const requireNoExistingProfile = () => {
  const {cachedProfile} = useUser()
  useGuard(!cachedProfile, () => routes.profile({id: cachedProfile!.id}), {
    toast: {
      title:
        'Your ethereum address already has a profile, so you cannot register again',
    },
  })
}

export const requireCameraAllowed = async () => {
  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => appNav(routes.registerAllowCamera()))
  }, [])
}
