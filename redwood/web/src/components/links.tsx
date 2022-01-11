import {Link as ChakraLink, LinkProps} from '@chakra-ui/layout'
import {
  BreadcrumbItem,
  BreadcrumbItemProps,
  BreadcrumbLink,
  BreadcrumbLinkProps,
} from '@chakra-ui/react'
import {Link as RedwoodLink} from '@redwoodjs/router'

export const RLink = React.forwardRef(({href, ...props}: LinkProps, ref) => (
  // @ts-expect-error there's something incompatible with the `color` prop, not sure if it's a real issue or just a problem with the typescript definitions
  <RedwoodLink to={href} {...props} ref={ref} />
))

export const InternalLink = (props: LinkProps) => (
  <ChakraLink as={RLink} {...props} />
)

export const BCILink = (props: BreadcrumbLinkProps & BreadcrumbItemProps) => (
  <BreadcrumbItem isCurrentPage={props.isCurrentPage}>
    <BreadcrumbLink as={RLink} {...props} />
  </BreadcrumbItem>
)
