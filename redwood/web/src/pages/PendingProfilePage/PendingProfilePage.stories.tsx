import {PendingProfilePageQuery} from 'types/graphql'
import PendingProfilePage from './PendingProfilePage'

const mock: PendingProfilePageQuery = {
  cachedProfile: null,
  registrationAttempt: {
    approved: true,
    videoCid: 'bafybeiaxvwuj72kcknxm5ofryao4pkqpks5qtadrakzcw743jqruli5zku',
    photoCid: 'bafybeicxoq24v5sxcz4myt5kx35kluclpoqhsfb2qdf5oevfuklprux2em',
    ethereumAddress: '0xae2C63F5EA082993eCf89E2977724727d47B6d7B',
    __typename: 'RegistrationAttempt',
  },
}

export const Page = () => {
  mockGraphQLQuery('PendingProfilePageQuery', () => mock)
  return <PendingProfilePage id={mock.registrationAttempt!.ethereumAddress} />
}

export default {title: 'Pages/PendingProfilePage'}
