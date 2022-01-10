import {Box, BoxProps} from '@chakra-ui/react'

// @ts-expect-error untyped package
import Jazzicon from '@metamask/jazzicon'
import {useEffect, useRef} from 'react'

type Props = {
  account: string
  size?: number
} & BoxProps
const Identicon = ({account, size = 16, ...props}: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = ''
      ref.current.appendChild(
        Jazzicon(size, parseInt(account.slice(2, 10), size))
      )
    }
  }, [ref, account, size])

  return <Box pt="1" {...props} ref={ref} />
}

export default Identicon
