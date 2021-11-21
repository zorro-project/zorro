import { Button, ButtonGroup } from '@chakra-ui/button'
import { Link, Stack, Text } from '@chakra-ui/layout'
import { Td, Tr } from '@chakra-ui/table'
import { Textarea } from '@chakra-ui/textarea'
import { useMutation } from '@redwoodjs/web'
import { PhotoBox, VideoBox } from 'src/components/SquareBox'
import { cairoCompatibleAdd } from 'src/lib/ipfs'
// import { bytesToFelt, notarySubmitProfile } from ''
import { ArrayElement } from 'src/lib/util'
import {
  ApproveProfileMutation,
  ApproveProfileMutationVariables,
  MutationAddNotaryFeedbackArgs,
  UnsubmittedProfilesQuery,
} from 'types/graphql'
import {
  bytesToFelt,
  notarySubmitProfile,
} from '../../../../api/src/lib/starknet'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<UnsubmittedProfilesQuery['unsubmittedProfiles']>
}> = ({ profile }) => {
  const [reviewed, setReviewed] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
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

  const [markApproved] = useMutation<
    ApproveProfileMutation,
    ApproveProfileMutationVariables
  >(gql`
    mutation ApproveProfileMutation($profileId: Int!) {
      approveProfile(profileId: $profileId)
    }
  `)

  // cid: 0x0170121b57e6343ef350734be0221416e1f5d2066721cd24a789cdb9fefe72
  // addr: 0x327e8AE4F9D6Cca061EE8C05dC728b9545c2AC78
  const onApprove = async () => {
    // setSubmitting(true)

    const cid = await cairoCompatibleAdd(
      JSON.stringify({ photo: profile.photoCID, video: profile.videoCID })
    )
    console.log(cid)
    const submittedProfile = await notarySubmitProfile(
      bytesToFelt(cid.bytes),
      profile.ethAddress
    )
    console.log(submittedProfile)

    // await markApproved({ variables: { profileId: profile.id } })
    // setReviewed(true)
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
            <Button
              colorScheme="red"
              onClick={onGiveFeedback}
              disabled={submitting}
            >
              Give Feedback
            </Button>
            <Button
              colorScheme="green"
              onClick={onApprove}
              disabled={submitting}
            >
              Approve
            </Button>
          </ButtonGroup>
        </Stack>
      </Td>
    </Tr>
  )
}

export default UnsubmittedProfile
