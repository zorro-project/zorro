from starkware.cairo.common.alloc import alloc
from starkware.starknet.common.syscalls import get_block_timestamp

from profile import Profile

func _get_seed_profiles{syscall_ptr : felt*}() -> (profiles_len : felt, profiles : Profile*):
    let profiles : Profile* = alloc()

    let (now) = get_block_timestamp()
    let ago_100 = now - 100
    let ago_1000 = now - 1000

    assert profiles[0] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        # Address 0x334230242D318b5CA159fc38E07dC1248B7b35e4
        ethereum_address=292634572195081279459106569596060995238487602660,
        submitter_address=23452345,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[1] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=123043451,
        submitter_address=234523451,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[2] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434502,
        submitter_address=23452342,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[3] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434503,
        submitter_address=23452343,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[4] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434504,
        submitter_address=23452344,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[5] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434505,
        submitter_address=23452345,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[6] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434506,
        submitter_address=23452346,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[7] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434507,
        submitter_address=23452347,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[8] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434508,
        submitter_address=2345238,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[9] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434509,
        submitter_address=23452349,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=0,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[10] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=12304345091,
        submitter_address=23452349,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=2,  # adjudication round completed
        challenge_timestamp=ago_100,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=now,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=0,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )
    assert profiles[11] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=12304345092,
        submitter_address=23452349,
        submission_timestamp=ago_1000,
        is_notarized=1,
        last_recorded_status=2,  # adjudication round completed
        challenge_timestamp=ago_100,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=now,
        adjudicator_evidence_cid=0,
        did_adjudicator_verify_profile=1,
        appeal_timestamp=0,
        appeal_id=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_overturn_adjudicator=0
        )

    return (12, profiles)
end
