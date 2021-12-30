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

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/profiles" page={ProfilesPage} name="profiles" />
        <Route path="/profiles/{id}" page={ProfilePage} name="profile" />
        <Route path="/unsubmitted-profiles" page={UnsubmittedProfilesPage} name="unsubmittedProfiles" />
        <Route path="/sign-up" page={SignUpPage} name="signUp" />
        <Route path="/sign-up/{purposeIdentifier}/{externalAddress}" page={SignUpPage} name="signUpAndconnect" />
        <Route path="/create-profile" page={CreateProfilePage} name="createProfile" />
        <Route path="/create-connection" page={CreateConnectionPage} name="createConnection" />
        <Route path="/test-transaction" page={TestTransactionPage} name="testTransaction" />
        <Route notfound page={NotFoundPage} />
      </Set>
    </Router>
  )
}

export default Routes
