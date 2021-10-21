import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/alert'
import { Box } from '@chakra-ui/layout'
import { Find_Unsubmitted_Profile } from 'types/graphql'

const ProfileStatus: React.FC<{
  profile: Find_Unsubmitted_Profile['unsubmittedProfile'] | null
}> = ({ profile }) => {
  if (!profile)
    return null

    // if ()
  ;<Alert status="info" mt="4">
    <AlertIcon />
    <Box>
      <AlertTitle>Pending Approval</AlertTitle>
      <AlertDescription fontSize="sm">
        A notary selected by the Nym community will review your profile to
        ensure it complies with the registry requirements.
      </AlertDescription>
    </Box>
  </Alert>
}
export default ProfileStatus
