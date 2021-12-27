import syncStarkNetState from '$api/src/tasks/syncStarkNetState'

export default async ({args}) => {
  console.log(':: Executing script with args ::')
  console.log(args)
  await syncStarkNetState()
}
