// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import {Route, Router, Set} from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'
import ChallengeProfilePage from './pages/ChallengeProfilePage/ChallengeProfilePage'
import SignUpContext from 'src/pages/SignUp/SignUpContext'

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
        <Route path="/sign-up" page={SignUpIntroPage} name="signUpIntro" />
        <Set wrap={SignUpContext}>
          <Route path="/sign-up/{purposeIdentifier}/{externalAddress}" page={SignUpIntroPage} name="signUpAndconnect" />
          <Route path="/sign-up/edit" page={SignUpEditPage} name="signUpEdit" />
          <Route path="/sign-up/presubmit" page={SignUpPresubmitPage} name="signUpPresubmit" />
        </Set>
        <Route path="/sign-up/submitted" page={SignUpSubmittedPage} name="signUpSubmitted" />
      </Set>
    </Router>
  )
}

export default Routes
