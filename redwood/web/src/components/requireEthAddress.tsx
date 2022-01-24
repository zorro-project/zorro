import {routes} from '@redwoodjs/router'
import {ReactElement, useContext} from 'react'
import UserContext from 'src/layouts/UserContext'
import {useNav} from 'src/lib/util'

const requireEthAddress = (element: ReactElement) => {
  const RequireEthAddress: React.FC = (props) => {
    const {ethereumAddress} = useContext(UserContext)
    if (!ethereumAddress) return useNav(routes.registerIntro(), {replace: true})
    return React.cloneElement(element, {...props, ethereumAddress})
  }

  return RequireEthAddress
}

export default requireEthAddress
