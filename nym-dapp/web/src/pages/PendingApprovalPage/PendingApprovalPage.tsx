import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const PendingApprovalPage = () => {
  return (
    <>
      <MetaTags
        title="PendingApproval"
        // description="PendingApproval description"
        /* you should un-comment description and add a unique description, 155 characters or less
        You can look at this documentation for best practices : https://developers.google.com/search/docs/advanced/appearance/good-titles-snippets */
      />
      <h1>PendingApprovalPage</h1>
      <p>
        Find me in <code>./web/src/pages/PendingApprovalPage/PendingApprovalPage.tsx</code>
      </p>
      <p>
        My default route is named <code>pendingApproval</code>, link to me with `
        <Link to={routes.pendingApproval()}>PendingApproval</Link>`
      </p>
    </>
  )
}

export default PendingApprovalPage
