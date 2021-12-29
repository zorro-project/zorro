from starkware.cairo.common.alloc import alloc

from profile import Profile

func _get_seed_profiles() -> (profiles_len : felt, profiles : Profile*):
    let profiles : Profile* = alloc()

    assert profiles[0] = Profile(
        cid=2540330837585055780539510783934115607915723316677950747298602475656452204,
        ethereum_address=12304345,
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
        cid=2540330871370158362645699064512463112286950257735777688725356692623268826,
        is_notarized=1,
        appeal_timestamp=0,
        ethereum_address=12304345,
        submitter_address=23452345,
        challenger_address=0,
        owner_evidence_cid=0,
        challenge_timestamp=0,
        last_recorded_status=0,
        submission_timestamp=2345,
        adjudication_timestamp=0,
        challenge_evidence_cid=0,
        adjudicator_evidence_cid=0,
        super_adjudication_timestamp=0,
        did_adjudicator_verify_profile=0,
        did_super_adjudicator_verify_profile=0
        )

    return (2, profiles)
end
