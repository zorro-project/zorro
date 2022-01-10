import {Button, ButtonGroup} from '@chakra-ui/button'
import {Link, Stack, Text} from '@chakra-ui/layout'
import {Td, Tr} from '@chakra-ui/table'
import {Textarea} from '@chakra-ui/textarea'
import {useMutation} from '@redwoodjs/web'
import {PhotoBox, VideoBox} from 'src/components/SquareBox'
import {cairoCompatibleAdd} from 'src/lib/ipfs'
// import { bytesToFelt, notarySubmitProfile } from ''
import {ArrayElement} from 'src/lib/util'
import {
  ApproveProfileMutation,
  ApproveProfileMutationVariables,
  MutationaddNotaryFeedbackArgs,
  UnsubmittedProfilesQuery,
} from 'types/graphql'
import {notarySubmitProfile} from '../../../../api/src/lib/starknet'
import {serializeCid} from '../../../../api/src/lib/serializers'

import getNotaryKey from '../../lib/getNotaryKey'

const UnsubmittedProfile: React.FC<{
  profile: ArrayElement<UnsubmittedProfilesQuery['unsubmittedProfiles']>
}> = ({profile}) => {
  const [reviewed, setReviewed] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const feedbackRef = React.useRef<HTMLTextAreaElement>(null)

  const [giveFeedback] = useMutation<MutationaddNotaryFeedbackArgs>(gql`
    mutation AddNotaryFeedback($id: Int!, $feedback: String!) {
      addNotaryFeedback(id: $id, feedback: $feedback)
    }
  `)

  const onGiveFeedback = async () => {
    await giveFeedback({
      variables: {id: profile.id, feedback: feedbackRef.current?.value},
    })

    setReviewed(true)
  }

  const [markApproved] = useMutation<
    ApproveProfileMutation,
    ApproveProfileMutationVariables
  >(gql`
    mutation ApproveProfileMutation($id: Int!) {
      approveProfile(id: $id)
    }
  `)

  const onApprove = async () => {
    const notaryKey = getNotaryKey()
    if (notaryKey == null) return
    setSubmitting(true)

    const cid = await cairoCompatibleAdd(
      JSON.stringify({photo: profile.photoCid, video: profile.videoCid})
    )

    const submittedProfile = await notarySubmitProfile(
      serializeCid(cid),
      profile.ethereumAddress,
      notaryKey
    )
    console.log(submittedProfile)

    await markApproved({variables: {id: profile.id}})
    setReviewed(true)
  }

  if (reviewed) return null

  return (
    <Tr>
      <Td>
        <Text size="xs">
          <Link
            href={`https://etherscan.io/address/${profile.ethereumAddress}`}
            isExternal
          >
            {profile.ethereumAddress}
          </Link>
        </Text>
      </Td>
      <Td>
        <PhotoBox photo={profile.photoCid} width="36" />
      </Td>
      <Td>
        <VideoBox video={profile.videoCid} width="36" />
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
