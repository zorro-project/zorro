import html from 'html-template-tag'
import transport from 'src/lib/mail'
import layout from './layout'

export default async function sendNotaryFeedback(to: string, feedback: string) {
  const body = layout(html`
    <p>
      Your Nym profile has been reviewed by a community notary. They requested
      changes before your profile is fully approved. Please review the changes
      and submit it again.
    </p>

    <p>Feedback given:</p>

    <pre>${feedback}</pre>

    <a href="http://localhost:8910/create-profile">Edit profile</a>.
  `)

  return await transport.sendMail({
    to,
    html: body,
    subject: 'Nym Profile Reviewed',
  })
}
