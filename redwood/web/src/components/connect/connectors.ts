import {InjectedConnector} from 'wagmi/connectors/injected'
import {WalletConnectConnector} from 'wagmi/connectors/walletConnect'
import {WalletLinkConnector} from 'wagmi/connectors/walletLink'

export default {
  injected: new InjectedConnector({options: {shimDisconnect: true}}),
  walletConnect: new WalletConnectConnector({
    options: {qrcode: true},
  }),
  walletLink: new WalletLinkConnector({
    options: {
      appName: 'Zorro',
    },
  }),
}
