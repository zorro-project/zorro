import { AccordionItem, AccordionPanel } from '@chakra-ui/accordion'
import { Button } from '@chakra-ui/button'
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control'
import { ListItem, OrderedList, Text } from '@chakra-ui/layout'
import { Textarea } from '@chakra-ui/textarea'
import { Form, useForm } from '@redwoodjs/forms'
import ResizeTextarea from 'react-textarea-autosize'
import { cairoCompatibleAdd } from 'src/lib/ipfs'
import { ProfilePageQuery } from 'types/graphql'
import ProfileAccButton from './ProfileAccButton'

const ChallengePanel = ({
  profile,
}: {
  profile: ProfilePageQuery['cachedProfile']
}) => {
  const onSubmit = React.useCallback(async (data) => {
    const cid = await cairoCompatibleAdd(data.evidence)
    console.log(cid)

    // TODO: disable form, update database
  }, [])

  const formMethods = useForm()

  return (
    <AccordionItem>
      <ProfileAccButton text="Challenge" />
      <AccordionPanel px="0">
        <Text>
          If you believe this profile is invalid, you have the option to{' '}
          <strong>challenge</strong> it. Challenging this profile requires a
          deposit of 0.01 ETH. If your challenge succeeds you'll receive 0.02
          ETH back, and if it fails the account holder will receive your
          deposit.
        </Text>
        <Text>
          A profile can be successfully challenged for any of the following
          reasons:
        </Text>
        <OrderedList p="2">
          <ListItem>
            It is a duplicate of another previously-submitted profile.
          </ListItem>
          <ListItem>
            It is controlled by someone other than the individual pictured.
          </ListItem>
          <ListItem>
            It doesn't belong to a real person (for example, it is a deepfake).
          </ListItem>
          <ListItem>It doesn't follow the submission guidelines.</ListItem>
        </OrderedList>
        <Form onSubmit={onSubmit} formMethods={formMethods}>
          <FormControl my="4">
            <FormLabel>Challenge Evidence</FormLabel>
            <Textarea
              placeholder="Example: 'This profile was clearly recorded by the same person who created the older profile found at [...]'"
              minRows={5}
              as={ResizeTextarea}
              {...formMethods.register('evidence')}
            />
            <FormHelperText>
              Be sure to include enough evidence to convince the adjucator that
              the challenge is valid. If you submit insufficient evidence the
              adjudicator will rule against you.
            </FormHelperText>
          </FormControl>
          <Button colorScheme="red" type="submit">
            Submit Challenge
          </Button>
        </Form>
      </AccordionPanel>
    </AccordionItem>
  )
}

export default ChallengePanel
