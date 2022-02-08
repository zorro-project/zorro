import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import NavLayout from './layouts/NavLayout/NavLayout'
import ChallengeProfilePage from './pages/ChallengeProfilePage/ChallengeProfilePage'
import RegisterLayout from 'src/pages/Register/RegisterLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/" page={SplashPage} name="splash" />
        <Set wrap={RegisterLayout}>
          <Route path="/register" page={RegisterIntroPage} name="registerIntro" />
          <Route path="/register/{purposeIdentifier}/{externalAddress}" page={RegisterIntroPage} name="registerAndConnect" />
          <Route path="/register/connect" page={RegisterConnectWalletPage} name="registerConnectWallet" />
          <Route path="/register/allow-camera" page={RegisterAllowCameraPage} name="registerAllowCamera" />
          <Route path="/register/photo" page={RegisterPhotoPage} name="registerPhoto" />
          <Route path="/register/video" page={RegisterVideoPage} name="registerVideo" />
          <Route path="/register/email" page={RegisterEmailPage} name="registerEmail" />
          <Route path="/register/submit" page={RegisterSubmitPage} name="registerSubmit" />
          <Route path="/register/submitted" page={RegisterSubmittedPage} name="registerSubmitted" />
          <Route path="/register/self-submit" page={RegisterSelfSubmitPage} name="registerSelfSubmit" />
        </Set>
        <Set wrap={NavLayout}>
          <Route path="/profiles" page={ProfilesPage} name="profiles" />
          <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
          <Route path="/pending-profile/{id}" page={PendingProfilePage} name="pendingProfile" />
          <Route path="/profiles/{id}/challenge" page={ChallengeProfilePage} name="challengeProfile" />

          <Route path="/unreviewed-registrations" page={UnreviewedRegistrationsPage} name="unreviewedRegistrations" />
          <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
          <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
          <Route notfound page={NotFoundPage} />
          <Route path="/user" page={UserPage} name="user" />
        </Set>
      </Set>
    </Router>
  )
}

export default Routes
