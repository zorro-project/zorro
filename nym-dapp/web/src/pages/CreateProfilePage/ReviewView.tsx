import {
  Box,
  FormControl,
  Heading,
  Image,
  ListItem,
  OrderedList,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import { useEthers } from '@usedapp/core'
import { useFormContext } from 'react-hook-form'
import ReactPlayer from 'react-player'
import Identicon from 'src/components/ConnectButton/Identicon'
import { dataFieldToUrl } from 'src/lib/util'
import { Card } from '../../components/Card'
import { SignupFieldValues } from './types'

const ReviewView = () => {
  const { account } = useEthers()
  const { watch } = useFormContext<SignupFieldValues>()
  const selfieUrl = dataFieldToUrl(watch('selfieCID'))
  const videoUrl = dataFieldToUrl(watch('videoCID'))

  return (
    <Stack spacing="6">
      <Heading size="lg">Review Public Profile</Heading>
      <Card>
        <Stack divider={<StackDivider />} spacing="8">
          <Box>
            <Stack width="full" spacing="4">
              <Heading size="md">Ethereum Wallet</Heading>
              <Text>
                This wallet will be linked to your real identity, so use a new
                one or one you don't mind revealing publicly.
              </Text>
              <Stack direction="row" justify="center" align="center">
                <Text fontWeight="bold" display="block">
                  {account}
                </Text>
                <Identicon />
              </Stack>
            </Stack>
          </Box>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <Heading size="md">Selfie</Heading>
              <Text>Does your picture match the requirements?</Text>
              <OrderedList fontSize="sm">
                <ListItem>Taken from the front</ListItem>
                <ListItem>
                  <strong>whole face</strong> visible
                </ListItem>
                <ListItem>
                  Nothing covering face (glasses, mask, makeup)
                </ListItem>
              </OrderedList>
            </FormControl>
            <Image src={selfieUrl} width="36" borderRadius="lg" shadow="lg" />
          </Stack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            alignItems="center"
            width="full"
            spacing="4"
          >
            <FormControl isRequired flex="1">
              <Heading size="md">Video</Heading>
              <Text>Does your video match the requirements?</Text>
              <OrderedList fontSize="sm">
                <ListItem>Face fully visible</ListItem>
                <ListItem>Right hand raised</ListItem>
                <ListItem>
                  Repeat "I solemnly swear this is my first time registering a
                  Nym profile"
                </ListItem>
              </OrderedList>
            </FormControl>
            {videoUrl && (
              <Box overflow="hidden" width="36" borderRadius="lg" shadow="lg">
                <ReactPlayer
                  url={videoUrl}
                  controls
                  width="100%"
                  height="auto"
                />
              </Box>
            )}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}

export default ReviewView
