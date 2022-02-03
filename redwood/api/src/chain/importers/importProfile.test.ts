import {exportProfileById} from 'src/chain/starknet'
import {db} from 'src/lib/db'
import {sendMessage} from 'src/lib/twilio'
// TODO: jest includes this natively in 27.4, switch to that version when
// Redwood upgrades https://github.com/facebook/jest/pull/12089
import {mocked} from 'ts-jest/dist/utils/testing'
import importProfile from './importProfile'
import parseProfileCid from './parseProfileCid'

jest.mock('src/chain/starknet')
jest.mock('src/lib/twilio')
jest.mock('src/chain/importers/parseProfileCid')

describe('importProfile', () => {
  test('sends new challenge notifications', async () => {
    let registrationAttempt = await db.registrationAttempt.create({
      data: {
        approved: true,
        ethereumAddress: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
        photoCid: 'test',
        videoCid: 'test',
      },
    })

    mocked(parseProfileCid).mockResolvedValueOnce({
      photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
      videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
    })

    mocked(exportProfileById).mockResolvedValueOnce({
      profile: {
        cid: '0x170121b909f5bf9672d64c328fb6196c0042b5bac45a7ce829b3a161a186c',
        ethereum_address: '0x334230242D318b5CA159fc38E07dC1248B7b35e4',
        submitter_address: '0x165dabd',
        submission_timestamp: '0x929',
        is_notarized: '0x1',
        last_recorded_status: '0x1',
        challenge_timestamp: '0x930',
        challenger_address:
          '0x7283241e75fe4bfa64af202c1243b56e7ab30c7ea41a6e2c6000c5874670dc4',
        challenge_evidence_cid:
          '0x170121b6e2ca4f121dea9096755acf32b4caa2d955b1a025b5ff8a8f7fdb6',
        owner_evidence_cid: '0x0',
        adjudication_timestamp: '0x0',
        adjudicator_evidence_cid: '0x0',
        did_adjudicator_verify_profile: '0x0',
        appeal_timestamp: '0x0',
        appeal_id: '0x0',
        super_adjudication_timestamp: '0x0',
        did_super_adjudicator_overturn_adjudicator: '0x0',
      },
      num_profiles: '0x1',
      is_verified: '0x0',
      current_status: '0x1',
      now: '0x931',
    })

    await importProfile(1)

    expect(mocked(sendMessage).mock.calls[0][1]).toEqual(
      'New challenge to profile 1'
    )

    const notification = await db.notification.findFirst()
    expect(notification?.key).toEqual({
      type: 'NEW_CHALLENGE',
      profileId: 1,
      challengeTimestamp: '1970-01-01T00:39:12.000Z',
    })

    registrationAttempt = (await db.registrationAttempt.findUnique({
      where: {id: registrationAttempt.id},
    }))!
    expect(registrationAttempt.profileId).toEqual(1)
  })

  test("doesn't send notifications for unchallenged profiles", async () => {
    mocked(parseProfileCid).mockResolvedValueOnce({
      photoCid: 'bafybeif63s5tuz2awex7qkmeki4wby25j4ifraa5lziyn3ifx75rv77qc4',
      videoCid: 'bafybeidadw2rw23ikkrhk7ehcxlaydyor27rslzbubony3qvvgmvt7bww4',
    })

    mocked(exportProfileById).mockResolvedValueOnce({
      profile: {
        cid: '0x170121b909f5bf9672d64c328fb6196c0042b5bac45a7ce829b3a161a186c',
        ethereum_address: '0x4956f0cd',
        submitter_address: '0x165dabd',
        submission_timestamp: '0x929',
        is_notarized: '0x1',
        last_recorded_status: '0x0',
        challenge_timestamp: '0x0',
        challenger_address:
          '0x7283241e75fe4bfa64af202c1243b56e7ab30c7ea41a6e2c6000c5874670dc4',
        challenge_evidence_cid:
          '0x170121b6e2ca4f121dea9096755acf32b4caa2d955b1a025b5ff8a8f7fdb6',
        owner_evidence_cid: '0x0',
        adjudication_timestamp: '0x0',
        adjudicator_evidence_cid: '0x0',
        did_adjudicator_verify_profile: '0x0',
        appeal_timestamp: '0x0',
        appeal_id: '0x0',
        super_adjudication_timestamp: '0x0',
        did_super_adjudicator_overturn_adjudicator: '0x0',
      },
      num_profiles: '0xa',
      is_verified: '0x1',
      current_status: '0x0',
      now: '0x75bcd15',
    })

    await importProfile(1)

    expect(mocked(sendMessage).mock.calls.length).toBe(0)
  })
})
