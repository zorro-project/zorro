import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import NavLayout from './layouts/NavLayout/NavLayout'
import ChallengeProfilePage from './pages/ChallengeProfilePage/ChallengeProfilePage'
import SignUpLayout from 'src/pages/SignUp/SignUpLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/" page={SplashPage} name="splash" />
        <Set wrap={SignUpLayout}>
          <Route path="/sign-up" page={SignUpIntroPage} name="signUpIntro" />
          <Route path="/sign-up/{purposeIdentifier}/{externalAddress}" page={SignUpIntroPage} name="signUpAndconnect" />
          <Route path="/sign-up/connect" page={SignUpConnectWalletPage} name="signUpConnectWallet" />
          <Route path="/sign-up/allow-camera" page={SignUpAllowCameraPage} name="signUpAllowCamera" />
          <Route path="/sign-up/photo" page={SignUpPhotoPage} name="signUpPhoto" />
          {/* @ts-expect-error https://github.com/redwoodjs/redwood/pull/4219 */}
          <Route path="/sign-up/video" page={SignUpVideoPage} name="signUpVideo" />
          <Route path="/sign-up/email" page={SignUpEmailPage} name="signUpEmail" />
          {/* @ts-expect-error https://github.com/redwoodjs/redwood/pull/4219 */}
          <Route path="/sign-up/submit" page={SignUpSubmitPage} name="signUpSubmit" />
          <Route path="/sign-up/submitted" page={SignUpSubmittedPage} name="signUpSubmitted" />
          <Route path="/sign-up/self-submit" page={SignUpSelfSubmitPage} name="signUpSelfSubmit" />
        </Set>
        <Set wrap={NavLayout}>
          <Route path="/profiles" page={ProfilesPage} name="profiles" />
          <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
          <Route path="/profiles/{id}/challenge" page={ChallengeProfilePage} name="challengeProfile" />

          <Route path="/unsubmitted-profiles" page={UnsubmittedProfilesPage} name="unsubmittedProfiles" />
          <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
          <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
          <Route notfound page={NotFoundPage} />
        </Set>
      </Set>
    </Router>
  )
}

export default Routes
