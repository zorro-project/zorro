import {Spacer, Stack, VStack, Box, Flex, Button} from '@chakra-ui/react'
import RegisterLogo from './RegisterLogo'
import Title from './Title'

export const TextContainer: React.FC = ({children, ...props}) => (
  <Flex maxW="340" alignSelf="center" {...props}>
    <VStack spacing="6" align="left">
      {children}
    </VStack>
  </Flex>
)

const RegisterScreen: React.FC = ({
  hero,
  title,
  shouldHideTitle,
  description,
  children,
  buttonDescription,
  PrimaryButtonComponent = Button,
  primaryButtonLabel,
  primaryButtonProps,
  secondaryButtonLabel,
  secondaryButtonProps,
}) => {
  const shouldShowLogo = !!hero
  return (
    <Stack flex="1">
      {hero}
      {!hero && <RegisterLogo pt={20} />}
      {title && !shouldHideTitle && (
        <Title title={title} pt={shouldShowLogo ? 4 : 8} />
      )}
      {description && <TextContainer pt="4">{description}</TextContainer>}
      {children}
      <Spacer />
      {buttonDescription && (
        <TextContainer pb="4">{buttonDescription}</TextContainer>
      )}
      {primaryButtonLabel && (
        <PrimaryButtonComponent
          variant="register-primary"
          {...primaryButtonProps}
        >
          {primaryButtonLabel}
        </PrimaryButtonComponent>
      )}
      <Flex h="70px" flexDirection="column" pt="4">
        {secondaryButtonLabel && (
          <Button variant="register-secondary" {...secondaryButtonProps}>
            {secondaryButtonLabel}
          </Button>
        )}
      </Flex>
    </Stack>
  )
}

export default RegisterScreen
