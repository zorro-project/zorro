import nodemailer from 'nodemailer'
import {htmlToText} from 'nodemailer-html-to-text'
import postmarkTransport from 'nodemailer-postmark-transport'

let transport: nodemailer.Transporter = nodemailer.createTransport({
  streamTransport: true,
})

if (process.env.POSTMARK_API_KEY) {
  transport = nodemailer.createTransport(
    postmarkTransport({
      auth: {
        apiKey: process.env.POSTMARK_API_KEY,
      },
    })
  )
} else if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

transport.use('compile', htmlToText())

export default transport
