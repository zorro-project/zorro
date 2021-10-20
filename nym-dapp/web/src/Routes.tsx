// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Set, Router, Route } from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/pending-profile" page={PendingProfilePage} name="pendingProfile" />
        <Route path="/sign-in" page={SignInPage} name="signIn" />
        <Route path="/sign-up" page={SignUpPage} name="signUp" />
        <Route notfound page={NotFoundPage} />
      </Set>
    </Router>
  )
}

export default Routes
