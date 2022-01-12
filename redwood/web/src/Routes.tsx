import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import ChallengeProfilePage from './pages/ChallengeProfilePage/ChallengeProfilePage'
import SignUpLayout from 'src/pages/SignUp/SignUpLayout'

const Routes = () => {
  return (
    <Router>
      <Route path="/" page={SplashPage} name="splash" />
      <Set wrap={AppLayout}>
        <Route path="/profiles" page={ProfilesPage} name="profiles" />
        <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
        <Route path="/profiles/{id}/challenge" page={ChallengeProfilePage} name="challengeProfile" />

        <Route path="/unsubmitted-profiles" page={UnsubmittedProfilesPage} name="unsubmittedProfiles" />
        <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
        <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
        <Route notfound page={NotFoundPage} />
        <Set wrap={SignUpLayout}>
          <Route path="/sign-up" page={SignUpIntroPage} name="signUpIntro" />
          <Route path="/sign-up/{purposeIdentifier}/{externalAddress}" page={SignUpIntroPage} name="signUpAndconnect" />
          <Route path="/sign-up/connect" page={SignUpConnectWalletPage} name="signUpConnectWallet" />
          <Route path="/sign-up/allow-camera" page={SignUpAllowCameraPage} name="signUpAllowCamera" />
          <Route path="/sign-up/record" page={SignUpRecordPage} name="signUpRecord" />
          <Route path="/sign-up/review" page={SignUpReviewPage} name="signUpReview" />
          <Route path="/sign-up/submitted" page={SignUpSubmittedPage} name="signUpSubmitted" />
        </Set>
      </Set>
    </Router>
  )
}

export default Routes
