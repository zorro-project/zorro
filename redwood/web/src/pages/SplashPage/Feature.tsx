import {Box, Stack, Text} from '@chakra-ui/react'
import * as React from 'react'

interface FeatureProps {
  icon: React.ReactElement
  title: string
  children: React.ReactNode
}

export const Feature = (props: FeatureProps) => {
  const {title, children, icon} = props
  return (
    <Box>
      <Box color="gray.800" fontSize="5xl">
        {icon}
      </Box>
      <Stack mt="6">
        <Text as="h3" color="gray.800" fontSize="xl" fontWeight="extrabold">
          {title}
        </Text>
        <Text pr="6" lineHeight="tall">
          {children}
        </Text>
      </Stack>
    </Box>
  )
}

export default Feature
