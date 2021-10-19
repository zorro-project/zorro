import {
  Box,
  Button,
  Stack,
  SlideFade,
  ButtonGroup,
  useColorModeValue,
  CircularProgress,
  Text,
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
  const [submitProgress, setSubmitProgress] = React.useState(0)

  const formValid = methods.formState.isValid && account != null

  const submit = React.useCallback<SubmitHandler<SignupFieldValues>>(
    async (data) => {
      console.log(data)
      const reportProgress = (bytes: number) =>
        setSubmitProgress(
          (100 * bytes) / (data.userSelfie.size + data.userVideo.size)
        )

      const uploadedSelfie = await ipfsClient.add(data.userSelfie as Blob, {
        progress: reportProgress,
      })
      const uploadedVideo = await ipfsClient.add(data.userVideo as Blob, {
        progress: (progress) => reportProgress(data.userSelfie.size + progress),
      })

      const selfieCID = uploadedSelfie.cid.toV1().toString()
      const videoCID = uploadedVideo.cid.toV1().toString()
    },
    []
  )

  let controlButtons = (
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

  if (methods.formState.isSubmitting) {
    controlButtons = (
      <Stack align="center" justify="center" direction="row" pt="6">
        <CircularProgress value={submitProgress} />
        <Text>Submitting...</Text>
      </Stack>
    )
  }

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
