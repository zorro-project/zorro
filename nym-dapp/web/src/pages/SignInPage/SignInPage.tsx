import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const SignInPage = () => {
  return (
    <>
      <MetaTags
        title="SignIn"
        // description="SignIn description"
        /* you should un-comment description and add a unique description, 155 characters or less
        You can look at this documentation for best practices : https://developers.google.com/search/docs/advanced/appearance/good-titles-snippets */
      />
      <h1>SignInPage</h1>
      <p>
        Find me in <code>./web/src/pages/SignInPage/SignInPage.tsx</code>
      </p>
      <p>
        My default route is named <code>signIn</code>, link to me with `
        <Link to={routes.signIn()}>SignIn</Link>`
      </p>
    </>
  )
}

export default SignInPage
