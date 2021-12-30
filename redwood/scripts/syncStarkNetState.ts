import syncStarkNetState from '$api/src/tasks/syncStarkNetState'

export default async ({args}) => {
  console.log('Syncing StarkNet state...')
  await syncStarkNetState()
}
