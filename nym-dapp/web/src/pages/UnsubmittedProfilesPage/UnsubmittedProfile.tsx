import { Button, ButtonGroup } from '@chakra-ui/button'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Image } from '@chakra-ui/image'
import { Box, Heading, Text, Stack, Link } from '@chakra-ui/layout'
import { Table, Thead, Tr, Th, Td } from '@chakra-ui/table'
import { Textarea } from '@chakra-ui/textarea'
import { routes } from '@redwoodjs/router'
import { MetaTags, useMutation, useQuery } from '@redwoodjs/web'
import ReactPlayer from 'react-player'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { ArrayElement, dataFieldToUrl } from 'src/lib/util'
import {
  ApproveProfileMutation,
  MutationAddNotaryFeedbackArgs,
  UnsubmittedProfilesPageQuery,
} from 'types/graphql'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<UnsubmittedProfilesPageQuery['unsubmittedProfiles']>
}> = ({ profile }) => {
  const [reviewed, setReviewed] = React.useState(false)
  const feedbackRef = React.useRef<typeof Textarea>()

  const [giveFeedback] = useMutation<MutationAddNotaryFeedbackArgs>(gql`
    mutation AddNotaryFeedback($profileId: Int!, $feedback: String!) {
      addNotaryFeedback(profileId: $profileId, feedback: $feedback)
    }
  `)

  const onGiveFeedback = async () => {
    await giveFeedback({
      variables: { profileId: profile.id, feedback: feedbackRef.current.value },
    })

    setReviewed(true)
  }

  const [approve] = useMutation<ApproveProfileMutation>(gql`
    mutation ApproveProfileMutation($profileId: Int!) {
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
        <PhotoBox photo={profile.photoCID} width="36" />
      </Td>
      <Td>
        <VideoBox video={profile.videoCID} width="36" />
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
