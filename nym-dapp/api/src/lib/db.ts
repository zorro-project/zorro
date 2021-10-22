// See https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/constructor
// for options.

import { PrismaClient } from '@prisma/client'

import {
  emitLogLevels,
  handlePrismaLogging,
  LogLevel,
} from '@redwoodjs/api/logger'

import { logger } from './logger'

const logLevels: LogLevel[] =
  process.env.NODE_ENV == 'production'
    ? ['info', 'warn', 'error']
    : ['query', 'info', 'warn', 'error']

export const db = new PrismaClient({
  log: emitLogLevels(logLevels),
})

handlePrismaLogging({
  db,
  logger,
  logLevels,
})
