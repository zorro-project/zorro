import {UseToastOptions} from '@chakra-ui/react'
import {navigate, useLocation} from '@redwoodjs/router'
import {useActivePageContext} from '@redwoodjs/router/dist/ActivePageContext'
import {NavigateOptions} from '@redwoodjs/router/dist/history'
import {merge, omit} from 'lodash'
import {useCallback, useEffect, useRef, useState} from 'react'
import {queueToast} from '../layouts/AppLayout/ToastManager'

type RedirectOptions = NavigateOptions & {toast?: UseToastOptions}

class GuardError extends Error {
  redirectTo: string
  options?: RedirectOptions

  constructor(redirectTo: string, options?: RedirectOptions) {
    super(`Redirecting to ${redirectTo}`)
    this.name = 'GuardError'
    this.redirectTo = redirectTo
    this.options = options
  }
}

class GuardErrorBoundary extends React.Component<{
  onError: (error: GuardError) => void
}> {
  state = {hasError: false}

  componentDidCatch(error: Error) {
    if (error instanceof GuardError) {
      this.setState({hasError: true})
      this.props.onError(error)
    } else {
      // Let non-GuardErrors bubble up
      throw error
    }
  }

  resetError() {
    this.setState({hasError: false})
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

export const GuardHandler: React.FC = ({children}) => {
  const {pathname} = useLocation()
  const {loadingState} = useActivePageContext()

  const [error, setError] = useState<GuardError | null>(null)
  const errorBoundary = useRef<GuardErrorBoundary>(null)

  const onError = useCallback((error: GuardError) => {
    if (error.options?.toast) queueToast(error.options.toast)

    const navOptionsWithDefaults: NavigateOptions = merge(
      {replace: true},
      omit(error.options, 'toast')
    )

    navigate(error.redirectTo, navOptionsWithDefaults)

    setError(error)
  }, [])

  // Clear the error when we've successfully loaded the new page
  useEffect(() => {
    if (!error) return

    const currentLoadingState = Object.values(loadingState).find(
      (obj) => obj?.location.pathname === pathname
    )

    if (currentLoadingState?.state === 'DONE') {
      setError(null)
      errorBoundary.current?.resetError()
    }
  }, [error, pathname, loadingState])

  return (
    <GuardErrorBoundary onError={onError} ref={errorBoundary}>
      {children}
    </GuardErrorBoundary>
  )
}

export function useGuard(
  // Using `any` instead of `boolean` to allow for any truthy/falsey value
  // eslint-disable-next-line
  condition: any,
  redirectTo: string | (() => string),
  options?: RedirectOptions
): asserts condition {
  if (!condition) {
    const pathToUse =
      typeof redirectTo === 'function' ? redirectTo() : redirectTo
    throw new GuardError(pathToUse, options)
  }
}

export default GuardHandler
