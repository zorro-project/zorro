import {
  Box,
  Button,
  Stack,
  SlideFade,
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

  const controlButtons = (
    <ButtonGroup pt="6" alignSelf="flex-end">
      {isReviewing ? (
        <>
          <Button onClick={() => setIsReviewing(false)}>Make Changes</Button>
          <Button colorScheme="blue">Submit</Button>
        </>
      ) : (
        <Button
          colorScheme="teal"
          // disabled={!formValid}
          onClick={() => setIsReviewing(true)}
        >
          Continue
        </Button>
      )}
    </ButtonGroup>
  )

  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.800')}
      px={{ base: '4', md: '10' }}
      py="16"
      minH="100vh"
    >
      <MetaTags
        title="Create Account"
        description="Sign up for a Nym account"
      />

      <FormProvider {...methods}>
        <SlideFade key={isReviewing.toString()} in={true}>
          <Stack maxW="xl" mx="auto">
            {isReviewing ? <ReviewView /> : <EditView />}
            {controlButtons}
          </Stack>
        </SlideFade>
      </FormProvider>
    </Box>
  )
}

export default SignUpPage
