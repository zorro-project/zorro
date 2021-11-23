import html from 'html-template-tag'
import transport from 'src/lib/mail'
import layout from './layout'

export default async function sendNotaryApproved(to: string, address: string) {
  const body = layout(html`
    <p>Great news!</p>

    <p>
      Your Nym profile has been reviewed and approved by a Nym community notary,
      and you can now use Nym to authenticate yourself as a unique person.
    </p>

    <p>
      To view your profile, just
      <a href="http://localhost:8910/profiles/${address}">click here</a>.
    </p>
  `)

  return await transport.sendMail({
    to,
    html: body,
    subject: 'Nym Profile Approved!',
  })
}
