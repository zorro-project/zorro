from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.default_dict import default_dict_new
from starkware.cairo.common.dict import dict_write, dict_read, dict_update, DictAccess

from consts import consts

struct Profile:
    member cid : felt  # cidv1 for profile pic/video/etc
    member ethereum_address : felt
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
    member did_adjudicator_verify_profile : felt

    # Set in the same tx that shifts `last_recorded_status` to `appealed`
    member appeal_timestamp : felt  # nonzero iff there was an appeal

    # Set in same tx that shifts `last_recorded_status` to `super_adjudicated`:
    member super_adjudication_timestamp : felt  # nonzero iff there was a super adjudication
    member did_super_adjudicator_verify_profile : felt
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

func _get_is_verified{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile, now : felt) -> (res : felt):
    alloc_locals
    let (status) = _get_current_status(profile, now)

    #
    # Status is `not_challenged`
    #

    if status == StatusEnum.NOT_CHALLENGED:
        # verified if notarized OR survived provisional period without being challenged
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
        return (profile.did_super_adjudicator_verify_profile)
    end

    let (did_adjudication_occur) = _get_did_adjudication_occur(profile)
    if did_adjudication_occur == 1:
        return (profile.did_adjudicator_verify_profile)
    end

    return (0)
end

func _get_dict_from_profile(profile : Profile) -> (res : DictAccess*):
    let ptr : felt* = &profile
    let (dict_ptr) = default_dict_new(0)
    with dict_ptr:
        dict_write(0, [ptr + 0])
        dict_write(1, [ptr + 1])
        dict_write(2, [ptr + 2])
        dict_write(3, [ptr + 3])
        dict_write(4, [ptr + 4])
        dict_write(5, [ptr + 5])
        dict_write(6, [ptr + 6])
        dict_write(7, [ptr + 7])
        dict_write(8, [ptr + 8])
        dict_write(9, [ptr + 9])
        dict_write(10, [ptr + 10])
        dict_write(11, [ptr + 11])
        dict_write(12, [ptr + 12])
        dict_write(13, [ptr + 13])
        dict_write(14, [ptr + 14])
        dict_write(15, [ptr + 15])
        assert Profile.SIZE = 16 # ensure this gets updated if Profile expands
    end

    # Note: we skip default_dict_finalize() because we don't actually rely
    # on the default value.

    return (dict_ptr)
end

func _get_profile_from_dict(dict_ptr : DictAccess*) -> (profile : Profile):
    with dict_ptr:
        let (v0) = dict_read(0)
        let (v1) = dict_read(1)
        let (v2) = dict_read(2)
        let (v3) = dict_read(3)
        let (v4) = dict_read(4)
        let (v5) = dict_read(5)
        let (v6) = dict_read(6)
        let (v7) = dict_read(7)
        let (v8) = dict_read(8)
        let (v9) = dict_read(9)
        let (v10) = dict_read(10)
        let (v11) = dict_read(11)
        let (v12) = dict_read(12)
        let (v13) = dict_read(13)
        let (v14) = dict_read(14)
        let (v15) = dict_read(15)
        assert Profile.SIZE = 16 # ensure this gets updated if Profile expands
    end

    let mem : felt* = alloc()
    assert mem[0] = v0
    assert mem[1] = v1
    assert mem[2] = v2
    assert mem[3] = v3
    assert mem[4] = v4
    assert mem[5] = v5
    assert mem[6] = v6
    assert mem[7] = v7
    assert mem[8] = v8
    assert mem[9] = v9
    assert mem[10] = v10
    assert mem[11] = v11
    assert mem[12] = v12
    assert mem[13] = v13
    assert mem[14] = v14
    assert mem[15] = v15
    assert Profile.SIZE = 16 # ensure this gets updated if Profile expands
    let profile = cast(mem, Profile*)
    return ([profile])
end
