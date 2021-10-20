// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Set, Router, Route, Private } from '@redwoodjs/router'
import AppLayout from './layouts/AppLayout/AppLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={AppLayout}>
        <Route path="/pending-profile" page={PendingProfilePage} name="pendingProfile" />
        <Route path="/create-profile" page={CreateProfilePage} name="createProfile" />
        <Route notfound page={NotFoundPage} />
      </Set>
    </Router>
  )
}

export default Routes
