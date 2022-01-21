import {useToast, UseToastOptions} from '@chakra-ui/react'
import {useLocation} from '@redwoodjs/router'
import {useEffect} from 'react'

const QUEUED_TOAST_KEY = 'ZORRO_QUEUED_TOAST'

export const ToastManager = () => {
  const {pathname} = useLocation()
  const toast = useToast({position: 'top'})

  // dismiss all active toasts every time we change pages
  useEffect(() => {
    toast.closeAll()

    const queuedToast = localStorage.getItem(QUEUED_TOAST_KEY)
    localStorage.removeItem(QUEUED_TOAST_KEY)
    if (queuedToast) {
      try {
        toast(JSON.parse(queuedToast))
      } catch (e) {
        console.error(e)
      }
    }
  }, [pathname])
  return null
}

// Queue a toast to show as soon as we navigate to the next page.
export const queueToast = (options: UseToastOptions) => {
  localStorage.setItem(QUEUED_TOAST_KEY, JSON.stringify(options))
}
