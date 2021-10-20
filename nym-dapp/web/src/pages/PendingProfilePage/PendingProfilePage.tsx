import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const PendingProfilePage = () => {
  return (
    <>
      <MetaTags
        title="PendingProfile"
        // description="PendingProfile description"
        /* you should un-comment description and add a unique description, 155 characters or less
        You can look at this documentation for best practices : https://developers.google.com/search/docs/advanced/appearance/good-titles-snippets */
      />
      <h1>PendingProfilePage</h1>
      <p>
        Find me in <code>./web/src/pages/PendingProfilePage/PendingProfilePage.tsx</code>
      </p>
      <p>
        My default route is named <code>pendingProfile</code>, link to me with `
        <Link to={routes.pendingProfile()}>PendingProfile</Link>`
      </p>
    </>
  )
}

export default PendingProfilePage
