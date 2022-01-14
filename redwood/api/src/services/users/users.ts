import type {ResolverArgs} from '@redwoodjs/graphql-server'
import {db} from 'src/lib/db'
import {MutationcreateUserArgs, QueryuserArgs} from 'types/graphql'

export const user = async ({ethereumAddress}: QueryuserArgs) =>
  db.user.findUnique({where: {ethereumAddress}})

export const createUser = async ({input}: MutationcreateUserArgs) =>
  db.user.create({data: input})

export const User = {
  hasEmail: (
    _args: void,
    {root}: ResolverArgs<NonNullable<Awaited<ReturnType<typeof user>>>>
  ) => root.email !== null,
}
