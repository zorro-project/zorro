from starkware.cairo.common.alloc import alloc

from profile import Profile

func _get_seed_profiles() -> (profiles_len : felt, profiles : Profile*):
    let profiles : Profile* = alloc()

    assert profiles[0] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=123043450,
        submitter_address=23452345,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[1] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=123043451,
        submitter_address=234523451,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[2] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434502,
        submitter_address=23452342,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[3] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434503,
        submitter_address=23452343,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[4] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434504,
        submitter_address=23452344,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[5] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434505,
        submitter_address=23452345,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[6] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434506,
        submitter_address=23452346,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[7] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434507,
        submitter_address=23452347,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[8] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434508,
        submitter_address=2345238,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )
    assert profiles[9] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=1230434509,
        submitter_address=23452349,
        submission_timestamp=2345,
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
        super_adjudication_timestamp=0,
        did_super_adjudicator_verify_profile=0
        )

    return (10, profiles)
end
