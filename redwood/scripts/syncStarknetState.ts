import syncStarknetState from '$api/src/tasks/syncStarknetState'

export default async ({args}) => {
  console.log('Syncing StarkNet state...')
  console.log(args)
  await syncStarknetState(!!args.onlyNew)
}
