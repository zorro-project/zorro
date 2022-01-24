import {Button} from '@chakra-ui/button'
import {Heading, Spacer, Stack} from '@chakra-ui/layout'
import {Alert, AlertIcon, CircularProgress, Image, Text} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {CellSuccessProps, createCell, MetaTags} from '@redwoodjs/web'
import dayjs from 'dayjs'
import React, {useCallback, useContext} from 'react'
import ReactPlayer from 'react-player'
import {InternalLink, RLink} from 'src/components/links'
import requireEthAddress from 'src/components/requireEthAddress'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {usePusher} from 'src/lib/pusher'
import {useNav} from 'src/lib/util'
import {registerSlice} from 'src/state/registerSlice'
import {useAppDispatch} from 'src/state/store'
import {RegisterSubmittedPageQuery} from 'types/graphql'
import {useInterval} from 'usehooks-ts'
import RegisterLogo from '../RegisterLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

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
        <Text>Expected wait: 30 seconds</Text>
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

const Success = (props: CellSuccessProps<RegisterSubmittedPageQuery>) => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress)
    return useNav(routes.registerIntro(), {
      toast: {
        title: 'Please connect a wallet',
        status: 'warning',
      },
    })

  const refetch = useCallback(() => {
    props.refetch?.()
  }, [props.refetch])

  usePusher(
    `unsubmittedProfile.${props.unsubmittedProfile?.ethereumAddress}`,
    'updated',
    refetch
  )
  useInterval(refetch, 60 * 1000)

  let body = null

  if (props.cachedProfile) {
    body = <CitizenshipActive />
  } else if (props.unsubmittedProfile) {
    if (props.unsubmittedProfile.UnaddressedFeedback) {
      body = (
        <ShowUnaddressedFeedback
          unsubmittedProfile={props.unsubmittedProfile}
        />
      )
    } else {
      body = <AwaitingCitizenship query={props} />
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

const Cell = createCell({
  QUERY: gql`
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
  `,
  Success,
})

export default requireEthAddress(<Cell />)
