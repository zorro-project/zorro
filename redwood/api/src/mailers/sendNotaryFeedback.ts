import html from 'html-template-tag'
import {urlBase} from 'src/lib/config'
import transport from 'src/lib/mail'
import {defaultFrom, layout} from './shared'

export default async function sendNotaryFeedback(
  to: string,
  deniedReason: string
) {
  const body = layout(html`
    <p>Hey there!</p>
    <p>
      A notary has reviewed the profile you submitted. 🔖 Unfortunately, they
      noticed a problem that requires you to resubmit. 😟 Please review the
      changes requested below and resubmit.
    </p>

    <p>Changes requested:</p>

    <pre>${deniedReason}</pre>

    <a href="${urlBase}/register/submitted">Click here</a> to edit your
    application. We'll get to it as soon as we can! 🙏
  `)

  return await transport.sendMail({
    to,
    from: defaultFrom,
    html: body,
    subject: 'Zorro registration: changes requested',
  })
}
