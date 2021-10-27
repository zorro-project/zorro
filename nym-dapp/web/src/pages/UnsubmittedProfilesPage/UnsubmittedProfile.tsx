import { Button, ButtonGroup } from '@chakra-ui/button'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image'
import { Box, Heading, Text, Stack, Link } from '@chakra-ui/layout'
import { Table, Thead, Tr, Th, Td } from '@chakra-ui/table'
import { Textarea } from '@chakra-ui/textarea'
import { routes } from '@redwoodjs/router'
import { MetaTags, useMutation, useQuery } from '@redwoodjs/web'
import ReactPlayer from 'react-player'
import { ArrayElement, dataFieldToUrl } from 'src/lib/util'
import {
  MutationAddNotaryFeedbackArgs,
  Unsubmitted_Profiles_Page,
} from 'types/graphql'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<Unsubmitted_Profiles_Page['unsubmittedProfiles']>
}> = ({ profile }) => {
  const photoUrl = dataFieldToUrl(profile.photoCID)
  const videoUrl = dataFieldToUrl(profile.videoCID)

  const [reviewed, setReviewed] = React.useState(false)
  const feedbackRef = React.useRef<typeof Textarea>()

  const [giveFeedback] = useMutation<MutationAddNotaryFeedbackArgs>(gql`
    mutation ADD_NOTARY_FEEDBACK($profileId: Int!, $feedback: String!) {
      addNotaryFeedback(profileId: $profileId, feedback: $feedback)
    }
  `)

  const onGiveFeedback = async () => {
    await giveFeedback({
      variables: { profileId: profile.id, feedback: feedbackRef.current.value },
    })

    setReviewed(true)
  }

  const [approve] = useMutation(gql`
    mutation APPROVE_PROFILE($profileId: Int!) {
      approveProfile(profileId: $profileId)
    }
  `)
  const onApprove = async () => {
    console.log('approving')
    // await approve()
    setReviewed(true)
  }

  if (reviewed) return null

  return (
    <Tr>
      <Td>
        <Text size="xs">
          <Link
            href={`https://etherscan.io/address/${profile.ethAddress}`}
            isExternal
          >
            {profile.ethAddress}
          </Link>
        </Text>
      </Td>
      <Td>
        <Image
          src={photoUrl}
          width="36"
          borderRadius="lg"
          shadow="lg"
          background="gray.200"
        />
      </Td>
      <Td>
        <Box overflow="hidden" width="36" borderRadius="lg" shadow="lg">
          <ReactPlayer url={videoUrl} controls width="100%" height="auto" />
        </Box>
      </Td>
      <Td>
        <Stack>
          <Textarea
            placeholder="Enter profile feedback here"
            ref={feedbackRef}
          />
          <ButtonGroup size="xs" alignSelf="flex-end">
            <Button colorScheme="red" onClick={onGiveFeedback}>
              Give Feedback
            </Button>
            <Button colorScheme="green" onClick={onApprove}>
              Approve
            </Button>
          </ButtonGroup>
        </Stack>
      </Td>
    </Tr>
  )
}

export default UnsubmittedProfile
