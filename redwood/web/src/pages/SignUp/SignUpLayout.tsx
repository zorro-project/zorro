import {useContext} from 'react'
import {useForm, UseFormReturn} from 'react-hook-form'
import UserContext from 'src/layouts/UserContext'

type SignupFieldValues = {
  photoCid: Blob | string
  videoCid: Blob | string
  email: string
}

type SignUpContextType = {
  formMethods: UseFormReturn<SignupFieldValues>
}

const SignUpContext = React.createContext<SignUpContextType>(null)

export default function SignUpLayout(props) {
  const user = useContext(UserContext)

  const formMethods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      photoCid: user.unsubmittedProfile?.photoCid,
      videoCid: user.unsubmittedProfile?.videoCid,
    },
  })

  return (
    <SignUpContext.Provider value={{formMethods}}>
      {props.children}
    </SignUpContext.Provider>
  )
}
