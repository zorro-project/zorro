import {Button} from '@chakra-ui/button'
import {Heading, Spacer, Stack} from '@chakra-ui/layout'
import {Alert, AlertIcon, CircularProgress, Image, Text} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags, useQuery} from '@redwoodjs/web'
import dayjs from 'dayjs'
import {Fireworks} from 'fireworks-js'
import React, {useCallback, useEffect} from 'react'
import ReactPlayer from 'react-player'
import {InternalLink, RLink} from 'src/components/links'
import {usePusher} from 'src/lib/pusher'
import {useGuard} from 'src/lib/useGuard'
import {maybeCidToUrl} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch} from 'src/state/store'
import {
  RegisterSubmittedPageQuery,
  RegisterSubmittedPageQueryVariables,
} from 'types/graphql'
import {useInterval} from 'usehooks-ts'
import {requireWalletConnected} from '../../../lib/guards'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const QUERY = gql`
  query RegisterSubmittedPageQuery($ethereumAddress: ID!) {
    user(ethereumAddress: $ethereumAddress) {
      id
      hasEmail
    }
    registrationAttempt: latestRegistration(ethereumAddress: $ethereumAddress) {
      id
      ethereumAddress
      photoCid
      videoCid
      notaryViewedAt
      reviewedAt
      approved

      deniedReason

      createdAt
    }
  }
`

const CitizenshipActive = () => {
  useEffect(() => {
    const fireworksContainer = document.createElement('div')
    fireworksContainer.style.position = 'absolute'
    fireworksContainer.style.top = '0'
    fireworksContainer.style.bottom = '0'
    fireworksContainer.style.left = '0'
    fireworksContainer.style.right = '0'
    document.getElementById('register-content')?.appendChild(fireworksContainer)
    const fireworks = new Fireworks(fireworksContainer, {
      friction: 0.95,
      delay: {min: 15, max: 30},
      speed: 2,
      opacity: 0.5,
      particles: 120,
      hue: {min: 218, max: 287},
    })

    fireworks.start()

    // Start fading out after 3 seconds (fadeout takes 2 seconds)
    setTimeout(() => {
      fireworksContainer.style.opacity = '0'
      fireworksContainer.style.transition = 'opacity 2s ease-in'
    }, 3000)

    // Stop after 5 seconds
    setTimeout(() => fireworks.stop(), 5000)
  }, [])
  return (
    <>
      <Title title="Congratulations!" />
      <Alert
        status="success"
        variant="solid"
        alignSelf="center"
        mt={6}
        borderRadius={6}
        width="initial"
      >
        <AlertIcon />
        <Text fontSize="lg">You're now a citizen</Text>
      </Alert>
    </>
  )
}

const TakingTooLong: React.FC<{query: RegisterSubmittedPageQuery}> = ({
  query,
}) => {
  return (
    <>
      <Heading size="md">This is taking longer than expected 🙁</Heading>
      <Text>Sorry about that, we might be overloaded with new citizens.</Text>
      {query.user?.hasEmail ? (
        <>
          <Text>
            <strong>You can close the page now.</strong> We'll email you when we
            get to your application!
          </Text>
          <Spacer />
        </>
      ) : (
        <>
          <Text>
            Check back later, or get email notifications about your application.
          </Text>
          <Text>It's fine to close this window.</Text>
          <Spacer />
          <Button
            variant="register-primary"
            onClick={() => navigate(routes.registerEmail({next: 'submitted'}))}
          >
            Get notified by email
          </Button>
        </>
      )}
      <Text size="sm" color="gray.500">
        Taking too long? Learn about{' '}
        <InternalLink
          href={routes.registerSelfSubmit()}
          color="inherit"
          textDecoration="underline"
        >
          manual profile submission
        </InternalLink>
        .
      </Text>
    </>
  )
}

const AwaitingReview: React.FC<{query: RegisterSubmittedPageQuery}> = ({
  query,
}) => {
  if (!query.registrationAttempt) return null

  const spinner = (
    <CircularProgress
      size="6rem"
      isIndeterminate
      color="purple.500"
      alignSelf="center"
      py={12}
    />
  )

  if (query.registrationAttempt.notaryViewedAt) {
    const notaryViewedAt = dayjs(query.registrationAttempt.notaryViewedAt)
    if (dayjs().subtract(3, 'minutes').isAfter(notaryViewedAt))
      return <TakingTooLong query={query} />

    return (
      <>
        <Title title="Checking your application" />
        {spinner}
        <Text>
          A volunteer community notary is looking at your application!
        </Text>
        <Text>Expected wait: 2 minutes</Text>
      </>
    )
  }

  const createdAt = dayjs(query.registrationAttempt.createdAt)
  if (dayjs().subtract(3, 'minutes').isAfter(createdAt))
    return <TakingTooLong query={query} />

  return (
    <>
      <Title title="Checking" />
      {spinner}
      <Text>
        Please stay on in case there are any problems with your application.
      </Text>
      <Text>We'll update you within 60 seconds.</Text>
    </>
  )
}

const ShowDeniedReason: React.FC<{
  registrationAttempt: NonNullable<
    RegisterSubmittedPageQuery['registrationAttempt']
  >
}> = ({registrationAttempt}) => {
  const dispatch = useAppDispatch()

  const startOver = useCallback(() => {
    dispatch(registerSlice.actions.resetForm())
    navigate(routes.registerPhoto())
  }, [])

  return (
    <>
      <Title title="Feedback from notary" />
      <Text>"{registrationAttempt.deniedReason}"</Text>
      <Stack direction="row">
        <UserMediaBox flex="1">
          <Image src={maybeCidToUrl(registrationAttempt.photoCid)} />
        </UserMediaBox>
        <UserMediaBox flex="1">
          <ReactPlayer
            url={maybeCidToUrl(registrationAttempt.videoCid)}
            controls
            width="100%"
            height="100%"
          />
        </UserMediaBox>
      </Stack>

      <Spacer />
      <Button variant="register-primary" onClick={startOver}>
        Make adjustments
      </Button>
      <Button
        as={RLink}
        variant="register-secondary"
        href={routes.registerSelfSubmit()}
      >
        I insist that my application is fine
      </Button>
    </>
  )
}

const SubmittedPage = () => {
  const ethereumAddress = requireWalletConnected()

  const {data, loading, refetch} = useQuery<
    RegisterSubmittedPageQuery,
    RegisterSubmittedPageQueryVariables
  >(QUERY, {
    variables: {ethereumAddress},
  })

  useGuard(loading || data?.registrationAttempt, routes.registerIntro(), {
    toast: {
      title:
        "Couldn't find your submitted registration. Are you connected to the correct wallet?",
      status: 'warning',
    },
  })

  usePusher(
    `registrationAttempt.${data?.registrationAttempt?.ethereumAddress}`,
    'updated',
    refetch
  )
  useInterval(refetch, 60 * 1000)

  if (data?.registrationAttempt == null) return null

  let body = null

  if (data.registrationAttempt.approved) {
    body = <CitizenshipActive />
  } else if (data.registrationAttempt.approved === false) {
    body = <ShowDeniedReason registrationAttempt={data.registrationAttempt} />
  } else {
    body = <AwaitingReview query={data} />
  }

  return (
    <Stack spacing="6" flex="1">
      <MetaTags title="Profile Submitted" />
      <RegisterLogo />
      {body}
    </Stack>
  )
}

export default SubmittedPage
