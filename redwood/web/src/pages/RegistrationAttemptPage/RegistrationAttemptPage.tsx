import {useApolloClient, useMutation, useQuery} from '@apollo/client'
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink} from '@chakra-ui/breadcrumb'
import {Box, Divider, Spacer, Stack} from '@chakra-ui/layout'
import {Button, ButtonGroup, Textarea} from '@chakra-ui/react'
import {RouteFocus, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import React, {useEffect, useState} from 'react'
import {RLink} from 'src/components/links'
import MinimalVideoPlayer from 'src/components/MinimalVideoPlayer'
import SquareBox, {PhotoBox} from 'src/components/SquareBox'
import {appNav, maybeCidToUrl} from 'src/lib/util'
import NotFoundPage from 'src/pages/NotFoundPage'
import {
  ApproveRegistrationMutation,
  ApproveRegistrationMutationVariables,
  MarkRegistrationViewed,
  MarkRegistrationViewedVariables,
  MutationdenyRegistrationArgs,
  GetNextUnassignedRegistration,
  RegistrationAttemptPageQuery,
  RegistrationAttemptPageQueryVariables,
} from 'types/graphql'

export const useNavigateToNextRegistrationAttempt = () => {
  const client = useApolloClient()

  return async () => {
    const {data} = await client.query<GetNextUnassignedRegistration>({
      query: gql`
        query GetNextUnassignedRegistration {
          nextUnassignedRegistration {
            id
          }
        }
      `,
    })
    if (data.nextUnassignedRegistration) {
      // This is the ugliest of hacks. Using the built-in Redwood navigation seems to be unreliable when transitioning between pages with the same route, so have to do a full page reload instead.
      window.location.href = routes.registrationAttempt({
        id: data.nextUnassignedRegistration.id.toString(),
      })
    } else {
      appNav(routes.registrationAttempts(), {
        toast: {status: 'success', title: 'All done!'},
      })
    }
  }
}

const RegistrationAttemptPage = ({id}: {id: string}) => {
  const [submitting, setSubmitting] = useState(false)
  const [deniedReason, setDeniedReason] = useState('')

  const {data} = useQuery<
    RegistrationAttemptPageQuery,
    RegistrationAttemptPageQueryVariables
  >(
    gql`
      query RegistrationAttemptPageQuery($id: ID!) {
        registrationAttempt(id: $id) {
          id
          photoCid
          videoCid
          ethereumAddress

          createdAt
          notaryViewedAt
          reviewedAt

          approved
          deniedReason
        }
      }
    `,
    {variables: {id}}
  )

  const registration = data?.registrationAttempt

  const navigateToNextRegistration = useNavigateToNextRegistrationAttempt()

  const [markViewed] = useMutation<
    MarkRegistrationViewed,
    MarkRegistrationViewedVariables
  >(gql`
    mutation MarkRegistrationViewed($id: ID!) {
      markRegistrationViewed(id: $id) {
        id
      }
    }
  `)
  useEffect(() => {
    registration && markViewed({variables: {id: registration.id.toString()}})
  }, [registration])

  const [denyRegistration] = useMutation<MutationdenyRegistrationArgs>(gql`
    mutation DenyRegistration($id: ID!, $feedback: String!) {
      denyRegistration(id: $id, feedback: $feedback) {
        id
        reviewedAt
      }
    }
  `)

  const onDenyRegistration = async () => {
    setSubmitting(true)
    await denyRegistration({
      variables: {id: registration!.id, feedback: deniedReason},
    })
    await navigateToNextRegistration()
  }

  const [approveRegistration] = useMutation<
    ApproveRegistrationMutation,
    ApproveRegistrationMutationVariables
  >(gql`
    mutation ApproveRegistrationMutation($id: ID!) {
      approveRegistration(id: $id) {
        id
        reviewedAt
      }
    }
  `)

  const onApprove = async () => {
    setSubmitting(true)
    await approveRegistration({variables: {id: registration!.id.toString()}})
    await navigateToNextRegistration()
  }

  if (data && !registration) return <NotFoundPage />

  const feedbackDisabled =
    submitting || !registration || registration.reviewedAt != null

  return (
    <>
      <MetaTags title="Registration Attempt" />
      <Stack direction="row" spacing="4" alignItems="center">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink
              href={routes.registrationAttempts()}
              as={RLink}
              fontWeight="bold"
            >
              Registrations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>{id}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Spacer />
        <Button size="sm" onClick={navigateToNextRegistration}>
          Review Another
        </Button>
      </Stack>

      <Stack w="xl" maxW="100%" mx="auto" my="8" spacing="6">
        <Stack direction="row" spacing="4">
          {registration?.photoCid && (
            <Box flex="1">
              <PhotoBox photo={registration?.photoCid} />
            </Box>
          )}
          {registration?.videoCid && (
            <Box flex="1">
              <SquareBox>
                <MinimalVideoPlayer
                  url={maybeCidToUrl(registration.videoCid)}
                  playOnLoad
                />
              </SquareBox>
            </Box>
          )}
        </Stack>
        <Divider />
        <Stack>
          <RouteFocus>
            <Textarea
              placeholder="Enter profile feedback here"
              onChange={(e) => setDeniedReason(e.target.value)}
              value={deniedReason}
              disabled={feedbackDisabled}
            />
          </RouteFocus>
          <ButtonGroup size="lg">
            <Button
              flex="1"
              padding="8"
              colorScheme="green"
              onClick={onApprove}
              disabled={feedbackDisabled || deniedReason.length > 0}
              isLoading={submitting}
            >
              Approve
            </Button>
            <Button
              flex="1"
              padding="8"
              colorScheme="red"
              onClick={onDenyRegistration}
              disabled={feedbackDisabled || deniedReason.length === 0}
              isLoading={submitting}
            >
              Deny
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>
    </>
  )
}

export default RegistrationAttemptPage
