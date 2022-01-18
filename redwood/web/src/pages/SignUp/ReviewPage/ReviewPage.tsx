import {Button} from '@chakra-ui/button'
import {Text, Heading, Input} from '@chakra-ui/react'
import {Spacer, Stack} from '@chakra-ui/layout'
import {navigate, Redirect, routes} from '@redwoodjs/router'
import {MetaTags} from '@redwoodjs/web'
import React, {
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react'
import ReactPlayer from 'react-player'
import {RLink} from 'src/components/links'
import {maybeCidToUrl} from 'src/components/SquareBox'
import UserContext from 'src/layouts/UserContext'
import {signUpSlice} from 'src/state/signUpSlice'
import {useAppDispatch, useAppSelector} from 'src/state/store'

const shadowStyle = {boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'}

const PopoverArrow = ({horizontalOffset}) => {
  const size = 14
  return (
    <div style={{position: 'relative'}}>
      <div
        className="arrow"
        style={{
          position: 'absolute',
          height: size,
          width: size,
          bottom: -size / 2,
          transform: 'rotate(45deg)',
          marginLeft: -size / 2,
          left: horizontalOffset,
          backgroundColor: 'white',
          ...shadowStyle,
        }}
      />
    </div>
  )
}

const Popover = ({width, height, children}) => {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'white',
      }}
    >
      <div className="popover" style={{width, height, ...shadowStyle}}></div>
      <PopoverArrow horizontalOffset={width / 2} />
      <div
        style={{
          backgroundColor: 'white',
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
        }}
      >
        {children}
      </div>
    </div>
  )
}

const ReviewPage = () => {
  const {ethereumAddress} = useContext(UserContext)
  if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />

  const signUpState = useAppSelector((state) => state.signUp)

  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const focusRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isPopoverOpen) {
      focusRef.current?.focus()
    }
  }, [focusRef.current, isPopoverOpen])

  const dispatch = useAppDispatch()

  //if (signUpState.photo == null || signUpState.video == null)
  //  return <Redirect to={routes.signUpRecord()} />

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
      <div style={{alignSelf: 'center', position: 'relative'}}>
        <Button
          //as={RLink}
          //href={routes.signUpEmail()}
          isDisabled={isPopoverOpen}
          onClick={() => setIsPopoverOpen(true)}
          colorScheme="purple"
          alignSelf="center"
        >
          Submit Application
        </Button>
        {isPopoverOpen && (
          <div style={{position: 'absolute', bottom: 50, left: -60}}>
            <Popover width={300} height={280}>
              <div style={{padding: 25}}>
                <Stack spacing={4}>
                  <Heading size="md">Notifications</Heading>
                  <Text>Get updates about the status of your application</Text>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    ref={focusRef}
                    value={''}
                    //onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button size="sm" colorScheme="purple">
                    Submit
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    as={RLink}
                    href={routes.signUpSubmit()}
                    colorScheme="purple"
                  >
                    Skip notifications
                  </Button>
                </Stack>
              </div>
            </Popover>
          </div>
        )}
      </div>
    </Stack>
  )
}

export default ReviewPage
