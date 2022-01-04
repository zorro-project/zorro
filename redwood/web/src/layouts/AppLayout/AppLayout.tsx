import {Box, useInterval} from '@chakra-ui/react'
import NavBar from './NavBar'
import {toast, Toaster} from '@redwoodjs/web/toast'
import {useLocation} from '@redwoodjs/router'
import {useEffect, useState} from 'react'

export default function AppLayout({children}) {
  const {pathname} = useLocation()

  useEffect(() => {
    // dismiss all active toasts
    toast.dismiss()
  }, [pathname])

  return (
    <Box minH="100vh">
      <Toaster />
      <NavBar />
      <Box p={8}>{children}</Box>
    </Box>
  )
}
