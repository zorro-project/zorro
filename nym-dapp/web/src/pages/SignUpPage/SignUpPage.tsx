import {
  Box,
  Button,
  Stack,
  ScaleFade,
  ButtonGroup,
  useColorModeValue,
} from '@chakra-ui/react'
import { MetaTags } from '@redwoodjs/web'
import { useEthers } from '@usedapp/core'
import { FormProvider, useForm } from 'react-hook-form'
import EditView from './EditView'
import ReviewView from './ReviewView'

const SignUpPage = () => {
  const methods = useForm({ mode: 'onChange' })
  const { account } = useEthers()
  const [isReviewing, setIsReviewing] = React.useState(false)

  const formValid = methods.formState.isValid && account != null

  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.800')}
      px={{ base: '4', md: '10' }}
      py="16"
    >
      <MetaTags
        title="Create Account"
        description="Sign up for a Nym account"
      />

      <FormProvider {...methods}>
        <Stack maxW="xl" mx="auto">
          <ScaleFade key={isReviewing.toString()} in={true}>
            {isReviewing ? <ReviewView /> : <EditView />}
          </ScaleFade>
          <ButtonGroup pt="6" alignSelf="flex-end">
            {isReviewing ? (
              <>
                <Button onClick={() => setIsReviewing(false)}>
                  Make Changes
                </Button>
                <Button colorScheme="blue">Submit</Button>
              </>
            ) : (
              <Button
                colorScheme="blue"
                // disabled={!formValid}
                onClick={() => setIsReviewing(true)}
              >
                Continue
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </FormProvider>
    </Box>
  )
}

export default SignUpPage
