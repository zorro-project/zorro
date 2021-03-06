import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import MinimalNavLayout from './layouts/MinimalNavLayout/MinimalNavLayout'
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
          <Route path="/register/how-it-works" page={RegisterHowItWorksPage} name="registerHowItWorks" />
          <Route path="/register/connect" page={RegisterConnectWalletPage} name="registerConnectWallet" />
          <Route path="/register/allow-camera" page={RegisterAllowCameraPage} name="registerAllowCamera" />
          <Route path="/register/photo" page={RegisterPhotoPage} name="registerPhoto" />
          <Route path="/register/video" page={RegisterVideoPage} name="registerVideo" />
          <Route path="/register/email" page={RegisterEmailPage} name="registerEmail" />
          <Route path="/register/submit" page={RegisterSubmitPage} name="registerSubmit" />
          <Route path="/register/submitted" page={RegisterSubmittedPage} name="registerSubmitted" />
          <Route path="/register/self-submit" page={RegisterSelfSubmitPage} name="registerSelfSubmit" />
        </Set>
        <Set wrap={MinimalNavLayout}>
          <Route path="/home" page={HomePage} name="home" />
          <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
          <Route path="/profiles/{id}/challenge" page={ChallengeProfilePage} name="challengeProfile" />
          {/*<Route path="/profiles" page={ProfilesPage} name="profiles" />*/}
          <Route path="/pending-profiles/{id}" page={PendingProfilePage} name="pendingProfile" />
          <Route path="/registration-attempts" page={RegistrationAttemptsPage} name="registrationAttempts" />
          <Route path="/registration-attempts/{id}" page={RegistrationAttemptPage} name="registrationAttempt" />
          <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
          <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
          <Route notfound page={NotFoundPage} />
        </Set>
      </Set>
    </Router>
  )
}

export default Routes
