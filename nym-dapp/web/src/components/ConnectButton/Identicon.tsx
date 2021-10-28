import { Box, BoxProps } from '@chakra-ui/react'
import Jazzicon from '@metamask/jazzicon'
import { useEffect, useRef } from 'react'

type Props = {
  account: string
  size?: number
} & BoxProps
const Identicon = ({ account, size = 16, ...props }: Props) => {
  const ref = useRef<HTMLDivElement>()

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(
        Jazzicon(size, parseInt(account.slice(2, 10), size))
      )
    }
  }, [ref])

  return <Box pt="1" {...props} ref={ref as any} />
}

export default Identicon
