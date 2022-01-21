import {Button} from '@chakra-ui/button'
import {Flex, Heading, Spacer, Stack} from '@chakra-ui/layout'
import {CircularProgress, Image, Text} from '@chakra-ui/react'
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
import {SignUpSubmittedPageQuery} from 'types/graphql'
import {useInterval} from 'usehooks-ts'
import SignUpLogo from '../SignUpLogo'
import Title from '../Title'
import UserMediaBox from '../UserMediaBox'

const CitizenshipActive = () => {
  return (
    <>
      <Title title="Citizenship active!" />
      <Text>Success!</Text>
    </>
  )
}

const TakingTooLong: React.FC<{query: SignUpSubmittedPageQuery}> = ({
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
          <Text>It's fine to close this window</Text>
          <Spacer />
          <Button
            variant="signup-primary"
            onClick={() => navigate(routes.signUpEmail())}
          >
            Get notified by email
          </Button>
        </>
      )}
      <Text size="sm" color="gray.500">
        Taking too long? Learn about{' '}
        <InternalLink
          href={routes.signUpSelfSubmit()}
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

const AwaitingCitizenship: React.FC<{query: SignUpSubmittedPageQuery}> = ({
  query,
}) => {
  if (!query.unsubmittedProfile) return

  const spinner = (
    <Flex flex="1" alignItems="center" justifyContent="center">
      <CircularProgress
        size="6rem"
        isIndeterminate
        color="purple.500"
        py="12"
      />
    </Flex>
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
      <Title title="Submitting" />
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
    SignUpSubmittedPageQuery['unsubmittedProfile']
  >
}> = ({unsubmittedProfile}) => {
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
      <Button as={RLink} variant="signup-primary" href={routes.signUpPhoto()}>
        Make adjustments
      </Button>
      <Button
        as={RLink}
        variant="signup-secondary"
        href={routes.signUpSelfSubmit()}
      >
        I insist that my application is fine
      </Button>
    </>
  )
  return <Text>{unsubmittedProfile.UnaddressedFeedback?.feedback}</Text>
}

const Success = (props: CellSuccessProps<SignUpSubmittedPageQuery>) => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress)
    return useNav(routes.signUpIntro(), {
      toast: {
        title: 'Please connect a wallet',
        status: 'warning',
      },
    })

  const refetch = useCallback(() => {
    console.log('refetching')
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
    return useNav(routes.signUpIntro(), {
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
      <SignUpLogo />
      {body}
    </Stack>
  )
}

const Cell = createCell({
  QUERY: gql`
    query SignUpSubmittedPageQuery($ethereumAddress: ID!) {
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
