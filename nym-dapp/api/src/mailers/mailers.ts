import Email from 'email-templates'
import path from 'path'

const email = new Email({
  message: {
    from: '"Nym ID" <test@test.com>',
  },
  transport: {
    jsonTransport: true,
  },
  preview: true,
})

const sendEmail = async (
  template: string,
  to: string,
  subject: string,
  locals?: Object
) => {
  const html = await email.render(
    path.join(__dirname, 'templates', template, 'html.pug'),
    locals
  )
  console.log(html)
  return await email.send({
    template: path.join(__dirname, 'templates', template),
    locals,
    message: {
      to,
      subject,
    },
  })
}

export const sendNotaryApproved = async (to: string, ethAddress: string) =>
  await sendEmail('notaryApproved', to, 'Nym Profile Approved!', {
    profileUrl: `http://localhost:8910/profiles/${ethAddress}`,
  })

export const sendNotaryFeedback = async (to: string, feedback: string) =>
  await sendEmail('notaryFeedback', to, 'Nym Profile Reviewed', {
    profileUrl: `http://localhost:8910/create-profile`,
    feedback,
  })
