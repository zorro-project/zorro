import {Button, ButtonGroup} from '@chakra-ui/button'
import {FormControl} from '@chakra-ui/form-control'
import {
  Box,
  Heading,
  ListItem,
  OrderedList,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/layout'
import {CircularProgress} from '@chakra-ui/progress'
import {useEthers} from '@usedapp/core'
import React from 'react'
import {useFormContext} from 'react-hook-form'
import {Card} from 'src/components/Card'
import Identicon from 'src/components/Identicon'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {SignupFieldValues} from 'src/pages/CreateProfilePage/types'

const PreSubmitView = (props: {submitProgress: number; onEdit: () => void}) => {
  const {account} = useEthers()
  const {watch, formState} = useFormContext<SignupFieldValues>()

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
            direction={{base: 'column', md: 'row'}}
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
            <PhotoBox photo={watch('photoCid')} width="36" shadow="lg" />
          </Stack>
          <Stack
            direction={{base: 'column', md: 'row'}}
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
                  Zorro profile"
                </ListItem>
              </OrderedList>
            </FormControl>
            <VideoBox
              video={watch('videoCid')}
              width="36"
              borderRadius="lg"
              shadow="lg"
            />
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
