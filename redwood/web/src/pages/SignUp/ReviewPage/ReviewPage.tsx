import {Button} from '@chakra-ui/button'
import {Spacer, Stack} from '@chakra-ui/layout'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import React, {useCallback, useContext} from 'react'
import ReactPlayer from 'react-player'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'

const ReviewPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  const signUpState = useAppSelector((state) => state.signUp)

  const dispatch = useAppDispatch()

  if (signUpState.photo == null || signUpState.video == null)
    return <Redirect to={routes.signUpRecord()} />

  const redo = useCallback(() => {
    dispatch(signUpSlice.actions.reset())
    navigate(routes.signUpRecord())
  }, [])

  return (
    <Stack spacing="6" flex="1" width="100%">
      <ReactPlayer
        url={maybeCidToUrl(signUpState.video)}
        controls
        width="100%"
        height="100%"
      />
      <MetaTags title="Review Profile" />
      <Spacer display={['initial', 'none']} />

      <Button colorScheme="purple" onClick={redo} alignSelf="center">
        Redo video
      </Button>
      <Button
        as={RLink}
        href={routes.signUpSubmit()}
        colorScheme="purple"
        alignSelf="center"
      >
        Continue
      </Button>
    </Stack>
  )
}

export default ReviewPage
