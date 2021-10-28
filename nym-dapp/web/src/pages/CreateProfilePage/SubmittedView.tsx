import { FormControl } from '@chakra-ui/form-control'
import {
  Box,
  Heading,
  ListItem,
  OrderedList,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/layout'
import React from 'react'
import { useEthers } from '@usedapp/core'
import { useFormContext } from 'react-hook-form'
import ReactPlayer from 'react-player'
import Identicon from 'src/components/ConnectButton/Identicon'
import { dataFieldToUrl } from 'src/lib/util'
import { Card } from 'src/components/Card'
import { SignupFieldValues } from 'src/pages/CreateProfilePage/types'
import { CircularProgress } from '@chakra-ui/progress'
import { Image } from '@chakra-ui/image'
import { ButtonGroup, Button } from '@chakra-ui/button'

const PreSubmitView = (props: {
  submitProgress: number
  onEdit: () => void
}) => {
  const { account } = useEthers()
  const { watch, formState } = useFormContext<SignupFieldValues>()
  const photoUrl = dataFieldToUrl(watch('photoCID'))
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
                <Identicon account={account} />
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
            <Image src={photoUrl} width="36" borderRadius="lg" shadow="lg" />
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
      {formState.isSubmitting ? (
        <Stack align="center" justify="center" direction="row">
          <CircularProgress value={props.submitProgress} />
          <Text>Submitting...</Text>
        </Stack>
      ) : (
        <ButtonGroup alignSelf="flex-end">
          <Button onClick={props.onEdit}>Make Changes</Button>
          <Button
            colorScheme="blue"
            type="submit"
            disabled={!formState.isValid}
          >
            Submit
          </Button>
        </ButtonGroup>
      )}
    </Stack>
  )
}

export default PreSubmitView
