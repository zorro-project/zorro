import {LinkProps} from '@chakra-ui/layout'
import {Link} from '@redwoodjs/router'

const RLink = ({href, ...props}: LinkProps) => <Link to={href} {...props} />

export default RLink
