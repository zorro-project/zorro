import {Heading} from '@chakra-ui/react'
import {MetaTags} from '@redwoodjs/web'

export default function Title({title}: {title: string}) {
  return (
    <>
      <Heading size="md" textAlign="center">
        {title}
      </Heading>
      <MetaTags title={title} />
    </>
  )
}
