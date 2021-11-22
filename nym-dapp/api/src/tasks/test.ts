import { db } from 'src/lib/db'

const test = async () => {
  console.log('testing')
  await db.random3.create({
    data: {
      id: 6,
      feedback: 'hi hi 3',
    },
    select: {
      id: true,
      feedback: true,
    },
  })
  console.log('done')
}

export default test

test()
