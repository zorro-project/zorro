import {Redirect, routes} from '@redwoodjs/router'
import {ReactElement, useContext} from 'react'
import UserContext from 'src/layouts/UserContext'

const requireEthAddress = (element: ReactElement) => {
  const RequireEthAddress: React.FC = (props) => {
    const {ethereumAddress} = useContext(UserContext)
    if (!ethereumAddress) return <Redirect to={routes.signUpIntro()} />
    return React.cloneElement(element, {...props, ethereumAddress})
  }

  return RequireEthAddress
}

export default requireEthAddress
