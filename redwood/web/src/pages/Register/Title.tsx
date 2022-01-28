import {Heading} from '@chakra-ui/react'
import {MetaTags} from '@redwoodjs/web'

export default function Title({title, ...rest}: {title: string}) {
  return (
    <>
      <Heading size="lg" textAlign="center" {...rest}>
        {title}
      </Heading>
      <MetaTags title={title} />
    </>
  )
}
