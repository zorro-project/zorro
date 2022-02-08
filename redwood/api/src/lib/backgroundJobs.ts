import {makeWorkerUtils, parseCronItems, run} from 'graphile-worker'

const initialize = async () => {
  await run({
    concurrency: 5,
    noHandleSignals: false,
    taskDirectory: `${__dirname}/../tasks`,
    parsedCronItems: parseCronItems([
      // Sync Starknet state every hour at 35 minutes past the hour (arbitrary offset)
      {
        task: 'syncStarknetState',
        pattern: '08 * * * *',
        options: {
          backfillPeriod: 0,
          maxAttempts: 1,
          queueName: 'scheduled_syncStarknetState',
          priority: 10,
        },
        identifier: 'scheduled_syncStarknetState',
      },
    ]),
  })

  const workerUtils = await makeWorkerUtils({})
  await workerUtils.migrate()
}

// We don't have any CPU or memory intensive tasks, so we can just run our
// workers in the web process for now for simplicity.
initialize()
