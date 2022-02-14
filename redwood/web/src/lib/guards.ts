import {routes} from '@redwoodjs/router'
import {requestMediaPermissions} from 'mic-check'
import {useEffect} from 'react'
import {UserContextType, useUser} from 'src/layouts/UserContext'
import {useGuard} from 'src/lib/useGuard'
import {appNav} from 'src/lib/util'
import {IterableElement} from 'type-fest'

export const requireAuthenticated = () => {
  const {user, loading} = useUser()
  useGuard(loading || user, routes.registerIntro())
}

export const requireNoExistingProfile = () => {
  const {cachedProfile, registrationAttempt, user} = useUser()
  useGuard(
    !cachedProfile,
    () => routes.profile({id: cachedProfile!.id.toString()}),
    {
      toast: {
        title: 'You have a live profile, so you cannot register again',
      },
    }
  )
  useGuard(
    !registrationAttempt?.approved,
    () => routes.pendingProfile({id: user!.ethereumAddress}),
    {
      toast: {
        title: 'Your profile has been submitted on-chain and will go live soon',
      },
    }
  )
}

export const requireCameraAllowed = async () => {
  // Make sure we have camera permissions
  useEffect(() => {
    requestMediaPermissions().catch(() => appNav(routes.registerAllowCamera()))
  }, [])
}

export const requireRole = (
  role: IterableElement<NonNullable<UserContextType['user']>['roles']>
) => {
  const {loading, user} = useUser()

  const hasRole = user?.roles?.includes(role)
  useGuard(loading || hasRole, routes.user(), {
    toast: {
      status: 'error',
      title: `You must be signed in to an account with the ${role} role to access this page.`,
    },
  })
}
