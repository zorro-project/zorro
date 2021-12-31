import {Link as ChakraLink, LinkProps} from '@chakra-ui/layout'
import {
  BreadcrumbItem,
  BreadcrumbItemProps,
  BreadcrumbLink,
  BreadcrumbLinkProps,
} from '@chakra-ui/react'
import {Link as RedwoodLink} from '@redwoodjs/router'

export const RLink = ({href, ...props}: LinkProps) => (
  <RedwoodLink to={href} {...props} />
)

export const InternalLink = (props: LinkProps) => (
  <ChakraLink as={RLink} {...props} />
)

export const BCILink = (props: BreadcrumbLinkProps & BreadcrumbItemProps) => (
  <BreadcrumbItem isCurrentPage={props.isCurrentPage}>
    <BreadcrumbLink as={RLink} {...props} />
  </BreadcrumbItem>
)
