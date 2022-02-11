import dayjs from 'dayjs'
import {db} from 'src/lib/db'
import tk from 'timekeeper'
import {Prisma} from '@prisma/client'
import {nextUnassignedRegistration} from './registrationAttempts'

describe('nextUnassignedRegistration', () => {
  const now = dayjs()

  const baseAttempt = {
    ethereumAddress: '0x123',
    photoCid: 'test',
    videoCid: 'test',
  }

  const createAttempts = async (
    data: Partial<Prisma.RegistrationAttemptCreateManyInput>[]
  ) => {
    await db.user.create({
      data: {
        ethereumAddress: '0x123',
      },
    })

    await db.registrationAttempt.createMany({
      data: data.map((attempt) => ({...baseAttempt, ...attempt})),
    })
  }

  beforeAll(() => {
    tk.freeze(now.toDate())
  })

  test('assigns the newest registration', async () => {
    await createAttempts([
      {
        id: 1,
        createdAt: now.subtract(1, 'day').toDate(),
      },
      {
        id: 2,
        createdAt: now.toDate(),
      },
    ])

    const result = await nextUnassignedRegistration()
    expect(result?.id).toEqual(2)
  })

  test("doesn't assign recently-assigned registrations", async () => {
    await createAttempts([
      {
        id: 1,
        createdAt: now.subtract(1, 'day').toDate(),
      },
      {
        id: 2,
        createdAt: now.toDate(),
        notaryViewedAt: now.subtract(1, 'minute').toDate(),
      },
    ])

    const result = await nextUnassignedRegistration()
    expect(result?.id).toEqual(1)
  })

  test('does re-assign registrations that were assigned a while ago', async () => {
    await createAttempts([
      {
        id: 1,
        createdAt: now.subtract(1, 'day').toDate(),
      },
      {
        id: 2,
        createdAt: now.toDate(),
        notaryViewedAt: now.subtract(10, 'minutes').toDate(),
      },
    ])

    const result = await nextUnassignedRegistration()
    expect(result?.id).toEqual(2)
  })

  test("doesn't assign reviewed registrations", async () => {
    await createAttempts([
      {
        approved: false,
      },
      {
        approved: true,
      },
      {
        reviewedAt: now.toDate(),
      },
    ])

    const result = await nextUnassignedRegistration()
    expect(result).toBeNull()
  })
  afterAll(() => {
    tk.reset()
  })
})
