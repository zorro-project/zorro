import {createGraphQLHandler} from '@redwoodjs/graphql-server'

import directives from 'src/directives/**/*.{js,ts}'
import sdls from 'src/graphql/**/*.sdl.{js,ts}'
import services from 'src/services/**/*.{js,ts}'

import {db} from 'src/lib/db'
import {logger} from 'src/lib/logger'

// Just make need to make sure this file gets loaded somewhere
import type {} from 'types/environment'

// Just need to make sure this file is imported at least once to start the background worker
import 'src/lib/backgroundJobs'

export const handler = createGraphQLHandler({
  loggerConfig: {logger, options: {operationName: true}},
  directives,
  sdls,
  services,
  onException: () => {
    // Disconnect from your database with an unhandled exception.
    db.$disconnect()
  },
})
