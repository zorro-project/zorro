import {CellSuccessProps, createCell} from '@redwoodjs/web'
import {useEthers} from '@usedapp/core'
import {useContext} from 'react'
import {useForm, UseFormReturn} from 'react-hook-form'
import UserContext from 'src/layouts/UserContext'
import {SignUpLayoutQuery} from 'types/graphql'

type SignupFieldValues = {
  photoCid: Blob | string
  videoCid: Blob | string
  email: string
}

type SignUpContextType = {
  formMethods: UseFormReturn<SignupFieldValues>
}

export default function SignUpLayout(props) {
  const user = useContext(UserContext)
  console.log({user})
  const {unsubmittedProfile} = user

  const formMethods = useForm<SignupFieldValues>({
    mode: 'onChange',
    defaultValues: {
      photoCid: user.unsubmittedProfile?.photoCid,
      videoCid: user.unsubmittedProfile?.videoCid,
    },
  })

  return props.children
}
