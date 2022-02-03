import RegisterLayout from '../RegisterLayout'
import ConnectWalletPage from './ConnectWalletPage'
import {Provider as EthersProvider} from 'wagmi'
import {StoryMocks} from 'src/lib/StoryMocks'

export const Awaiting_Connection = () => (
  <EthersProvider>
    <RegisterLayout>
      <ConnectWalletPage />
    </RegisterLayout>
  </EthersProvider>
)

export const Reused_Address = () => (
  <StoryMocks user={{ethereumAddress: '0x456'}}>
    <EthersProvider>
      <RegisterLayout>
        <ConnectWalletPage mockIsFresh={false} />
      </RegisterLayout>
    </EthersProvider>
  </StoryMocks>
)

export const Reuse_Address_Modal = () => (
  <StoryMocks user={{ethereumAddress: '0x45645645645645645645'}}>
    <EthersProvider>
      <RegisterLayout>
        <ConnectWalletPage mockIsFresh={false} mockModalOpen />
      </RegisterLayout>
    </EthersProvider>
  </StoryMocks>
)

export default {title: 'Pages/Register/2. Connect Wallet'}
