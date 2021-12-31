import {Link, Stack, Text} from '@chakra-ui/layout'
import {Button} from '@chakra-ui/react'
import {routes} from '@redwoodjs/router'
import React, {ReactElement} from 'react'
import RLink, {InternalLink} from 'src/components/links'
import {ProfilePageQuery, StatusEnum} from 'types/graphql'

const ChallengePageLink = (props: {
  profile: ProfilePageQuery['cachedProfile']
  text: string
}) => (
  <InternalLink href={routes.challengeProfile({id: props.profile.id})}>
    {props.text}
  </InternalLink>
)

const ChallengeLink = ({
  profile,
}: {
  profile: ProfilePageQuery['cachedProfile']
}) => {
  const notChallenged = (
    <Text>
      Believe this profile is invalid?{' '}
      <ChallengePageLink profile={profile} text="Challenge it" />.
    </Text>
  )

  const challengeFinished = (
    <Stack align="flex-start">
      <Text>
        The latest profile challenge has finished but hasn't been settled. You
        must settle the old challenge to release funds and/or start a new
        challenge.
      </Text>
      {/* TODO: call maybe_settle */}
      <Button colorScheme="blue" size="sm">
        Settle Challenge
      </Button>
    </Stack>
  )

  const linkConfigs: {[key in StatusEnum]: ReactElement} = {
    NOT_CHALLENGED: notChallenged,
    CHALLENGED: null,
    ADJUDICATION_ROUND_COMPLETED: (
      <Text>
        Did the adjudicators make a mistake and this profile should actually be{' '}
        {profile.didAdjudicatorVerifyProfile ? 'unverified' : 'verified'}?
        <ChallengePageLink profile={profile} text="submit an appeal" />.
      </Text>
    ),
    APPEALED: (
      <Text>
        <Link isExternal href="https://court.kleros.io/">
          Visit Kleros
        </Link>{' '}
        to monitor the appeal process.
      </Text>
    ),
    APPEAL_OPPORTUNITY_EXPIRED: challengeFinished,
    SUPER_ADJUDICATION_ROUND_COMPLETED: challengeFinished,
    SETTLED: notChallenged,
  }

  return linkConfigs[profile.currentStatus]
}

export default ChallengeLink
