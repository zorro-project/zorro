import {Button} from '@chakra-ui/button'
import {Heading, Spacer, Stack} from '@chakra-ui/layout'
import {Alert, AlertIcon, CircularProgress, Image, Text} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {MetaTags, useQuery} from '@redwoodjs/web'
import dayjs from 'dayjs'
import React, {useCallback} from 'react'
import ReactPlayer from 'react-player'
import {InternalLink, RLink} from 'src/components/links'
import {usePusher} from 'src/lib/pusher'
import {maybeCidToUrl, useNav} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch} from 'src/state/store'
import {
  RegisterSubmittedPageQuery,
  RegisterSubmittedPageQueryVariables,
} from 'types/graphql'
import {useInterval} from 'usehooks-ts'
import {requireWalletConnected} from '../guards'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const QUERY = gql`
  query RegisterSubmittedPageQuery($ethereumAddress: ID!) {
    user(ethereumAddress: $ethereumAddress) {
      id
      hasEmail
    }
    unsubmittedProfile(ethereumAddress: $ethereumAddress) {
      id
      ethereumAddress
      photoCid
      videoCid
      lastSubmittedAt
      notaryViewedAt
      notaryApprovedAt

      UnaddressedFeedback {
        feedback
      }
    }
    cachedProfile: cachedProfileByEthereumAddress(
      ethereumAddress: $ethereumAddress
    ) {
      id
    }
  }
`

const CitizenshipActive = () => {
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

const AwaitingCitizenship: React.FC<{query: RegisterSubmittedPageQuery}> = ({
  query,
}) => {
  if (!query.unsubmittedProfile) return null

  const spinner = (
    <CircularProgress
      size="6rem"
      isIndeterminate
      color="purple.500"
      alignSelf="center"
      py={12}
    />
  )

  if (query.unsubmittedProfile.notaryApprovedAt) {
    const notaryApprovedAt = dayjs(query.unsubmittedProfile.notaryApprovedAt)
    if (dayjs().subtract(60, 'seconds').isAfter(notaryApprovedAt))
      return <TakingTooLong query={query} />

    return (
      <>
        <Title title="Activating citizenship" />
        {spinner}
        <Text textAlign="center">
          Your application has been approved by a community notary! We're just
          waiting for the submission to go through on-chain.
        </Text>
        <Text textAlign="center">Expected wait: 30 seconds</Text>
      </>
    )
  }

  if (query.unsubmittedProfile.notaryViewedAt) {
    const notaryViewedAt = dayjs(query.unsubmittedProfile.notaryViewedAt)
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

  const lastSubmittedAt = dayjs(query.unsubmittedProfile.lastSubmittedAt)
  if (dayjs().subtract(3, 'minutes').isAfter(lastSubmittedAt))
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

const ShowUnaddressedFeedback: React.FC<{
  unsubmittedProfile: NonNullable<
    RegisterSubmittedPageQuery['unsubmittedProfile']
  >
}> = ({unsubmittedProfile}) => {
  const dispatch = useAppDispatch()

  const startOver = useCallback(() => {
    dispatch(registerSlice.actions.resetForm())
    navigate(routes.registerPhoto())
  }, [])

  return (
    <>
      <Title title="Feedback from notary" />
      <Text>"{unsubmittedProfile.UnaddressedFeedback?.feedback}"</Text>
      <Stack direction="row">
        <UserMediaBox flex="1">
          <Image src={maybeCidToUrl(unsubmittedProfile.photoCid)} />
        </UserMediaBox>
        <UserMediaBox flex="1">
          <ReactPlayer
            url={maybeCidToUrl(unsubmittedProfile.videoCid)}
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

  const {data, refetch} = useQuery<
    RegisterSubmittedPageQuery,
    RegisterSubmittedPageQueryVariables
  >(QUERY, {
    variables: {ethereumAddress},
  })

  // const refetch = useCallback(() => {
  //   props.refetch?.()
  // }, [props.refetch])

  usePusher(
    `unsubmittedProfile.${data?.unsubmittedProfile?.ethereumAddress}`,
    'updated',
    refetch
  )
  useInterval(refetch, 60 * 1000)

  if (data == null) return null

  let body = null

  if (data.cachedProfile) {
    body = <CitizenshipActive />
  } else if (data.unsubmittedProfile) {
    if (data.unsubmittedProfile.UnaddressedFeedback) {
      body = (
        <ShowUnaddressedFeedback unsubmittedProfile={data.unsubmittedProfile} />
      )
    } else {
      body = <AwaitingCitizenship query={data} />
    }
  } else {
    return useNav(routes.registerIntro(), {
      toast: {
        title:
          "Couldn't find your submitted profile. Are you connected to the correct wallet?",
        status: 'warning',
      },
    })
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
