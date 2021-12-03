from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin

from consts import consts

struct Profile:
    member cid : felt  # cidv1 for profile pic/video/etc
    member address : felt
    member submitter_address : felt
    member submission_timestamp : felt
    member is_notarized : felt
    member last_recorded_status : felt  # one of StatusEnum

    # Set in same tx that shifts `last_recorded_status` to `challenged`:
    member challenge_timestamp : felt  # nonzero iff there was a challenge
    member challenger_address : felt
    member challenge_evidence_cid : felt

    # Optionally set while `last_recorded_status` is `challenged`:
    member owner_evidence_cid : felt

    # Set in same tx that shifts `last_recorded_status` to `adjudicated`:
    member adjudication_timestamp : felt  # nonzero iff there was an adjudication
    member adjudicator_evidence_cid : felt
    member did_adjudicator_confirm_profile : felt

    # Set in the same tx that shifts `last_recorded_status` to `appealed`
    member appeal_timestamp : felt  # nonzero iff there was an appeal

    # Set in same tx that shifts `last_recorded_status` to `super_adjudicated`:
    member super_adjudication_timestamp : felt  # nonzero iff there was a super adjudication
    member did_super_adjudicator_confirm_profile : felt
end

namespace StatusEnum:
    const NOT_CHALLENGED = 0  # intentionally `0` to save a write when submitting a new profile
    const CHALLENGED = 1
    const ADJUDICATION_ROUND_COMPLETED = 2  # adjudicated, or adjudication opportunity timed out
    const APPEALED = 3
    const APPEAL_OPPORTUNITY_EXPIRED = 4
    const SUPER_ADJUDICATION_ROUND_COMPLETED = 5  # super adjudicated, or super adjudication opportunity timed out
    const SETTLED = 6  # rewards/deposits/etc have been disbursed
end

#
# Profile accessors
#

func _get_did_adjudication_occur(profile : Profile) -> (res : felt):
    if profile.adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_appeal_occur(profile : Profile) -> (res : felt):
    if profile.appeal_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_super_adjudication_occur(profile : Profile) -> (res : felt):
    if profile.super_adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_is_in_provisional_time_window{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile, now) -> (res : felt):
    let time_passed_since_submission = now - profile.submission_timestamp
    let (res) = is_le(time_passed_since_submission, consts.PROVISIONAL_TIME_WINDOW)
    return (res)
end

# automatically advances between statuses based on timeouts. It follows the gray "timeout" lines on this chart:
# https://lucid.app/lucidchart/df9f25d3-d9b0-4d0a-99d1-b1eac42eff3b/edit?viewport_loc=-1482%2C-119%2C4778%2C2436%2C0_0&invitationId=inv_56861740-601a-4a1e-8d61-58c60906253d
func _get_current_status{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile, now : felt) -> (status : felt):
    alloc_locals
    local range_check_ptr : felt = range_check_ptr

    tempvar last_recorded_status = profile.last_recorded_status

    #
    # Not challenged
    #

    if last_recorded_status == StatusEnum.NOT_CHALLENGED:
        return (StatusEnum.NOT_CHALLENGED)
    end

    #
    # Challenged
    #

    if last_recorded_status == StatusEnum.CHALLENGED:
        let time_passed = now - profile.challenge_timestamp

        # Potentially time out all the way through `adjudication_round_completed` to `appeal_opportunity_expired`
        let (has_appeal_opportunity_expired) = is_le(
            consts.ADJUDICATION_TIME_WINDOW + consts.APPEAL_TIME_WINDOW, time_passed)
        if has_appeal_opportunity_expired == 1:
            return (StatusEnum.APPEAL_OPPORTUNITY_EXPIRED)
        end

        # Potentially time out to `adjudication_round_completed`
        let (has_adjudication_opportunity_expired) = is_le(
            consts.ADJUDICATION_TIME_WINDOW, time_passed)
        if has_adjudication_opportunity_expired == 1:
            return (StatusEnum.ADJUDICATION_ROUND_COMPLETED)
        end

        return (StatusEnum.CHALLENGED)
    end

    #
    # Adjudicated
    #

    if last_recorded_status == StatusEnum.ADJUDICATION_ROUND_COMPLETED:
        let time_passed = now - profile.adjudication_timestamp

        # Potentially auto-advance to `appeal_opportunity_expired`
        let (has_appeal_opportunity_expired) = is_le(consts.APPEAL_TIME_WINDOW, time_passed)
        if has_appeal_opportunity_expired == 1:
            return (StatusEnum.APPEAL_OPPORTUNITY_EXPIRED)
        end

        return (StatusEnum.ADJUDICATION_ROUND_COMPLETED)
    end

    #
    # Appealed
    #

    if last_recorded_status == StatusEnum.APPEALED:
        let time_passed = now - profile.appeal_timestamp

        # Potentially auto-advance to `super_adjudication_round_completed`
        let (has_super_adjudication_opportunity_expired) = is_le(
            consts.SUPER_ADJUDICATION_TIME_WINDOW, time_passed)
        if has_super_adjudication_opportunity_expired == 1:
            return (StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED)
        end

        return (StatusEnum.APPEALED)
    end

    #
    # Super adjudicated
    #

    if last_recorded_status == StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED:
        return (StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED)
    end

    #
    # Settled
    #

    if last_recorded_status == StatusEnum.SETTLED:
        return (StatusEnum.SETTLED)
    end

    assert 0 = 1  # Should be unreachable
    return (0)
end

func _get_is_confirmed{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile, now : felt) -> (res : felt):
    alloc_locals
    let (status) = _get_current_status(profile, now)

    #
    # Status is `not_challenged`
    #

    if status == StatusEnum.NOT_CHALLENGED:
        # confirmed if notarized OR survived provisional period without being challenged
        let (is_provisional) = _get_is_in_provisional_time_window(profile, now)

        # is_notarized || !is_provisional
        if (profile.is_notarized - 1) * is_provisional == 0:
            return (1)
        else:
            return (0)
        end
    end

    #
    # Status is `challenged`
    #

    if status == StatusEnum.CHALLENGED:
        # Presume innocence or not depending on whether the profile was still provisional
        # when it was challenged
        let (is_presumed_innocent) = is_le(
            consts.PROVISIONAL_TIME_WINDOW,
            profile.challenge_timestamp - profile.submission_timestamp)
        return (is_presumed_innocent)
    end

    #
    # All other statuses, e.g. `adjudicated`, ...
    #

    # Logic:
    # 1. A super adjudiciation is determinative
    # 2. Absent that, adjudication is determinative
    # 3. Absent that, presume the challenger was correct

    let (did_super_adjudication_occur) = _get_did_super_adjudication_occur(profile)
    if did_super_adjudication_occur == 1:
        return (profile.did_super_adjudicator_confirm_profile)
    end

    let (did_adjudication_occur) = _get_did_adjudication_occur(profile)
    if did_adjudication_occur == 1:
        return (profile.did_adjudicator_confirm_profile)
    end

    return (0)
end
