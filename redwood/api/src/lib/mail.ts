import nodemailer from 'nodemailer'
import {htmlToText} from 'nodemailer-html-to-text'
import * as sesClient from '@aws-sdk/client-ses'

let transport: nodemailer.Transporter = nodemailer.createTransport({
  streamTransport: true,
})

if (process.env.CHAIN_DEPLOYMENT === 'staging') {
  const ses = new sesClient.SES({
    apiVersion: '2010-12-01',
    region: 'us-west-2',
  })

  transport = nodemailer.createTransport({
    SES: {ses, aws: sesClient},
  })
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
