import {
  Box,
  Flex,
  HStack,
  ListItem,
  Text,
  VStack,
  List,
  Center,
} from '@chakra-ui/layout'
import {Image, ListIcon} from '@chakra-ui/react'
import {navigate, routes} from '@redwoodjs/router'
import {requireNoExistingProfile} from 'src/lib/guards'
import {VerifiedStatus} from 'src/components/ProfileStatus'
import RegisterScreen, {TextContainer} from '../RegisterScreen'
import {
  CarouselProvider,
  Slider,
  Slide,
  CarouselContext,
} from 'pure-react-carousel'
import 'pure-react-carousel/dist/react-carousel.es.css'
import Title from '../Title'
import {useContext} from 'react'
import {BsExclamationCircleFill, BsLockFill} from 'react-icons/bs'

const HowItWorksPage = () => {
  requireNoExistingProfile()

  return (
    <CarouselProvider
      // @ts-ignore
      style={{height: '100%'}}
      totalSlides={slides.length}
      isIntrinsicHeight={true}
    >
      <Contents />
    </CarouselProvider>
  )
}

const Contents = () => {
  const carouselContext = useContext(CarouselContext)

  return (
    <RegisterScreen
      shouldHideTitle
      title="How Zorro Works"
      primaryButtonLabel="Continue"
      primaryButtonProps={{
        onClick: () => {
          const {currentSlide} = carouselContext.state
          if (currentSlide === slides.length - 1) {
            navigate(routes.registerConnectWallet())
          } else {
            carouselContext.setStoreState({
              currentSlide: currentSlide + 1,
            })
          }
        },
      }}
    >
      <Slider>
        {slides.map((SlideContent, i) => (
          <Slide index={i} key={i}>
            <Box maxW="320" mx="auto">
              <SlideContent />
            </Box>
          </Slide>
        ))}
      </Slider>
    </RegisterScreen>
  )
}

const FirstSlide = () => (
  <Flex direction="column">
    <Title title="How Zorro works" pt="8" />
    <TextContainer pt="4">
      <Text>
        The purpose of Zorro is to create a list of <strong>unique</strong>{' '}
        people, to keep out bots and spammers.
      </Text>
      <Text>
        It's important that you understand how Zorro works before you register.
        We'll explain on the next screens.
      </Text>
    </TextContainer>
  </Flex>
)

const SelfieRow = ({index}: {index: number}) => (
  <HStack spacing={5}>
    <Text fontWeight="semibold">#{index}</Text>
    <Image
      src={`/registration/selfies/selfie-${index}.png`}
      width="60px"
      height="60px"
    />
    <VerifiedStatus />
  </HStack>
)
const SecondSlide = () => (
  <Flex direction="column">
    <Title title="Zorro is a list of selfies that everyone can see" pt="8" />
    <VStack mt={8}>
      <SelfieRow index={1} />
      <SelfieRow index={2} />
      <SelfieRow index={3} />
    </VStack>
  </Flex>
)

const ThirdSlide = () => (
  <Flex direction="column">
    <Title title="Anyone can add themselves to the list" pt="8" />
    <TextContainer pt="4">
      <Text>Anyone can register by submitting a selfie.</Text>
      <Text>
        Existing community members help guide registrations and pay gas fees.
      </Text>
    </TextContainer>
  </Flex>
)

const FourthSlide = () => (
  <Flex direction="column">
    <Title title="Each person can only be added once" pt="8" />
    <TextContainer pt="4">
      <Text>Duplicates can be challenged and removed.</Text>

      <Text>
        That's why the list of selfies is public. If it were private, then there
        could be duplicates without anyone knowing.
      </Text>
    </TextContainer>
  </Flex>
)
const FifthSlide = () => (
  <Flex direction="column">
    <Title title="Privacy of registering" pt="8" />
    <TextContainer pt="4" justifyContent="center" alignItems="center" flex="1">
      <Center>
        <List spacing={4} maxW="300px">
          <ListItem>
            <ListIcon as={BsLockFill} />
            Doesn't require a name
          </ListItem>
          <ListItem>
            <ListIcon as={BsLockFill} />
            Doesn't require an ID card
          </ListItem>
          <ListItem>
            <ListIcon as={BsLockFill} />
            Doesn't reveal your ethereum address
          </ListItem>
          <ListItem>
            <ListIcon as={BsExclamationCircleFill} />
            <strong>Does</strong> reveal your selfie, which shows that you’re
            someone who is interested in web3
          </ListItem>
        </List>
      </Center>
    </TextContainer>
  </Flex>
)

const slides = [FirstSlide, SecondSlide, ThirdSlide, FourthSlide, FifthSlide]

export default HowItWorksPage
