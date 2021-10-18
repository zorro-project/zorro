import { useEffect, useRef } from 'react'
import { useEthers } from '@usedapp/core'
import Jazzicon from '@metamask/jazzicon'
import { css } from '@emotion/react'
import { Box } from '@chakra-ui/react'

export default function Identicon() {
  const ref = useRef<HTMLDivElement>()
  const { account } = useEthers()

  useEffect(() => {
    if (account && ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(Jazzicon(16, parseInt(account.slice(2, 10), 16)))
    }
  }, [account])

  return <Box height="20px" ref={ref as any} />
}
