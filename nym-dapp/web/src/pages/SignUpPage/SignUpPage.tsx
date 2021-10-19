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
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import ipfsClient from 'src/lib/ipfsClient'
import EditView from './EditView'
import ReviewView from './ReviewView'
import { SignupFieldValues } from './types'

const SignUpPage = () => {
  const methods = useForm<SignupFieldValues>({ mode: 'onChange' })
  const { account } = useEthers()
  const [isReviewing, setIsReviewing] = React.useState(false)

  const formValid = methods.formState.isValid && account != null

  const submit = React.useCallback<SubmitHandler<SignupFieldValues>>(
    async (data) => {
      console.log(data)
      const uploadedSelfie = await ipfsClient.add(data.userSelfie as Blob)
      console.log(uploadedSelfie)
      const uploadedVideo = await ipfsClient.add(data.userVideo as Blob)
      console.log('video done')
      console.log(uploadedVideo)
      console.log('submitted')
    },
    [methods]
  )

  const controlButtons = (
    <ButtonGroup pt="6" alignSelf="flex-end">
      {isReviewing ? (
        <>
          <Button onClick={() => setIsReviewing(false)}>Make Changes</Button>
          <Button colorScheme="blue" type="submit" disabled={!formValid}>
            Submit
          </Button>
        </>
      ) : (
        <Button
          colorScheme="teal"
          disabled={!formValid}
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
        <form onSubmit={methods.handleSubmit(submit)}>
          <SlideFade key={isReviewing.toString()} in={true}>
            <Stack maxW="xl" mx="auto">
              {isReviewing ? <ReviewView /> : <EditView />}
              {controlButtons}
            </Stack>
          </SlideFade>
        </form>
      </FormProvider>
    </Box>
  )
}

export default SignUpPage
