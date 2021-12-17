import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/alert'
import { Box, Text } from '@chakra-ui/layout'
import { FindUnsubmittedProfileQuery } from 'types/graphql'

const ProfileStatus: React.FC<{
  profile: FindUnsubmittedProfileQuery['unsubmittedProfile'] | null
}> = ({ profile }) => {
  if (!profile) return null

  if (profile.UnaddressedFeedback) {
    return (
      <Alert status="error" mt="4">
        <AlertIcon />
        <Box>
          <AlertTitle>Error Found</AlertTitle>
          <AlertDescription fontSize="sm">
            <Text>Please address the following issue with your profile:</Text>
            <Text fontWeight="bold">
              {profile.UnaddressedFeedback.feedback}
            </Text>
          </AlertDescription>
        </Box>
      </Alert>
    )
  }

  return (
    <Alert status="info" mt="4">
      <AlertIcon />
      <Box>
        <AlertTitle>Pending Approval</AlertTitle>
        <AlertDescription fontSize="sm">
          A notary selected by the Zorro community will review your profile to
          ensure it complies with the registry requirements.
        </AlertDescription>
      </Box>
    </Alert>
  )
}

export default ProfileStatus
