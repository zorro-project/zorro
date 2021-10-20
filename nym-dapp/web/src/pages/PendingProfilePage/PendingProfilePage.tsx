// import {
//   Alert,
//   AlertDescription,
//   AlertIcon,
//   AlertTitle,
// } from '@chakra-ui/alert'
// import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control'
// import { Heading, Stack, StackDivider, Text } from '@chakra-ui/layout'
// import { createCell, MetaTags } from '@redwoodjs/web'
// import { useEthers } from '@usedapp/core'
// import { FormProvider, useForm } from 'react-hook-form'
// import { Card } from 'src/components/Card'
// import { Pending_Profile_Page } from 'types/graphql'
// import SelfieField from '../CreateProfilePage/SelfieField'
// import { SignupFieldValues } from '../CreateProfilePage/types'
// import VideoField from '../CreateProfilePage/VideoField'

// // const QUERY =

// const Success = (props: Pending_Profile_Page) => {
//   const methods = useForm<SignupFieldValues>({
//     mode: 'onChange',
//     defaultValues: {
//       selfieCID: `https://${props.unsubmittedProfile.selfieCID}.ipfs.infura-ipfs.io`,
//       videoCID: `https://${props.unsubmittedProfile.videoCID}.ipfs.infura-ipfs.io`,
//     },
//   })

//   return (
//     <FormProvider {...methods}>
//       <Stack maxW="xl" mx="auto">
//         <MetaTags title="Profile Pending" />
//         <Heading size="lg">Profile Pending</Heading>
//         <Alert status="info" mt="4">
//           <AlertIcon />
//           <AlertTitle>Status: Awaiting Review</AlertTitle>
//           <AlertDescription fontSize="sm">
//             A Nym community notary will review your profile to make sure it
//             meets our requirements soon.
//           </AlertDescription>
//         </Alert>

//         <Text></Text>
//         <Text>
//           If there are any issues with your profile, be sure to fix them now.
//           Once your profile is approved and added to the registry you won't be
//           able to make any further changes.
//         </Text>
//         <Card>
//           <Stack divider={<StackDivider />} spacing="8">
//             <Stack
//               direction={{ base: 'column', md: 'row' }}
//               alignItems="center"
//               width="full"
//               spacing="4"
//             >
//               <FormControl isRequired flex="1">
//                 <FormLabel>Selfie</FormLabel>
//                 <FormHelperText>
//                   We need a picture of you to make sure you're a unique human.
//                 </FormHelperText>
//               </FormControl>
//               <SelfieField />
//             </Stack>
//             <Stack
//               direction={{ base: 'column', md: 'row' }}
//               alignItems="center"
//               width="full"
//               spacing="4"
//             >
//               <FormControl isRequired flex="1">
//                 <FormLabel>Video</FormLabel>
//                 <FormHelperText>
//                   Recording a video makes it harder for bots to get into the
//                   registry.
//                 </FormHelperText>
//               </FormControl>
//               <VideoField />
//             </Stack>
//           </Stack>
//         </Card>
//       </Stack>
//     </FormProvider>
//   )
// }

// const Cell = createCell<{ ethAddress: string }>({
//   QUERY,
//   Success,
//   Loading: () => <Text>Loading...</Text>,
// })

// const PendingProfilePage = () => {
//   const { account } = useEthers()

//   if (!account) return <Text>Connect to a wallet before continuing</Text>

//   return <Cell ethAddress={account} />
// }

// export default PendingProfilePage
