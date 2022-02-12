import {
  Box,
  BoxProps,
  Button,
  Flex,
  FlexProps,
  Spacer,
  Stack,
  VStack,
} from '@chakra-ui/react'
import {ComponentProps} from 'react'
import RegisterLogo from './RegisterLogo'
import Title from './Title'

const containerHorizontalPadding = 4
export const FullWidthBox = (props: BoxProps) => (
  <Box mx={-containerHorizontalPadding} {...props} />
)

export const TextContainer = ({
  children,
  ...props
}: FlexProps & {children: React.ReactNode}) => (
  <Flex maxW="340" alignSelf="center" {...props}>
    <VStack spacing="6" align="left">
      {children}
    </VStack>
  </Flex>
)

type RegisterScreenProps<
  PrimaryButtonT extends React.ElementType = typeof Button,
  SecondaryButtonT extends React.ElementType = typeof Button
> = {
  hero?: React.ReactNode
  title?: string
  shouldHideTitle?: boolean
  description?: React.ReactNode
  children?: React.ReactNode
  buttonDescription?: React.ReactNode
  PrimaryButtonComponent?: PrimaryButtonT
  primaryButtonLabel?: string
  primaryButtonProps?: ComponentProps<PrimaryButtonT>
  secondaryButtonLabel?: string
  secondaryButtonProps?: ComponentProps<SecondaryButtonT>
}

const RegisterScreen = ({
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
}: RegisterScreenProps) => {
  const shouldShowLogo = !!hero
  return (
    <Stack flex="1" height="100%" px={containerHorizontalPadding}>
      {hero ? <FullWidthBox>{hero}</FullWidthBox> : <RegisterLogo pt={20} />}
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
