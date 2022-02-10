import html from 'html-template-tag'
import {urlBase} from 'src/lib/config'
import transport from 'src/lib/mail'
import {defaultFrom, layout} from './shared'

export default function sendNotaryApproved(to: string, address: string) {
  const body = layout(html`
    <p>Great news!</p>

    <p>
      Your Zorro profile has been reviewed and approved by a Zorro notary! 🎉
      You can now use Zorro to authenticate yourself as a unique person.
    </p>

    <p>
      To view your profile, just
      <a href="${urlBase}/pending-profiles/${address}">click here</a>. And
      welcome to the community! 🤗
    </p>
  `)

  return transport.sendMail({
    to,
    from: defaultFrom,
    html: body,
    subject: "You're a web3 citizen!",
  })
}
