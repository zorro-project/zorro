import * as dotenv from 'dotenv'
import {REST} from '@discordjs/rest'
import {Routes} from 'discord-api-types/v9'
import {Client, Intents, TextChannel, User} from 'discord.js'
import {max} from 'lodash'
import {createObjectCsvWriter} from 'csv-writer'

dotenv.config()

const csvWriter = createObjectCsvWriter({
  path: '/tmp/discord-reactions.csv',
  header: [
    {id: 'link', title: 'link'},
    {id: 'username', title: 'username'},
    {id: 'discriminator', title: 'discriminator'},
    {id: 'bot', title: 'bot'},
    {id: 'id', title: 'id'},
    {id: 'avatar', title: 'avatar'},
  ],
})

const main = async () => {
  const client = new Client({intents: [Intents.FLAGS.GUILDS]})

  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
  })

  await client.login(process.env.DISCORD_BOT_TOKEN)

  const announcements = (await client.channels.fetch(
    '932334721113923584'
  )) as TextChannel

  const message = await announcements.messages.fetch('938501247630205029')
  const reactions = message.reactions.resolve('✋') // 💻 to test

  const loaded: Record<string, User> = {}

  while (Object.keys(loaded).length < reactions.count) {
    const maxIdFetched = max(Object.keys(loaded))
    const newUsers = await reactions.users.fetch({after: maxIdFetched})
    newUsers.forEach((user) => (loaded[user.id] = user))
  }

  console.log(`Writing ${Object.values(loaded).length} users to csv`)
  await csvWriter.writeRecords(
    Object.values(loaded).map((user) => ({
      ...user,
      link: `https://discordapp.com/users/${user.id}`,
    }))
  )

  console.log('Done!')
}

console.log('Starting')
main()
