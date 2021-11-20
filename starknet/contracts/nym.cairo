%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.registers import get_fp_and_pc
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.cairo.common.uint256 import Uint256
from starkware.starknet.common.syscalls import get_caller_address

from OpenZepplin.IERC20 import IERC20

#
# Constants
#

const SUBMISSION_DEPOSIT_SIZE = 25  # This constant is also in test.py
const CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in test.py

# Profiles challenged while still provision are presumed to be invalid; those challenged after are presumed valid
const PROVISIONAL_TIME_WINDOW = 9 * 24 * 60 * 60  # 9 days

# The amount of time the adjudicator has to act after a profile is challenged
const ADJUDICATION_TIME_WINDOW = 6 * 24 * 60 * 60  # 6 days

# The amount of time someone has to initiate an appeal after a profile is adjudicated (or not adjudicated due to timeout)
const APPEAL_TIME_WINDOW = 3 * 24 * 60 * 60  # 3 days

# the amount of time the super adjudicator has to act after a profile is appealed
# XXX: estimate this correctly: log2(num kleros jurors) * max_time_per_round
# Alternatively, we could send an L1->L2 message each appeal round, which would extend the window
const SUPER_ADJUDICATION_TIME_WINDOW = 30 * 24 * 60 * 60  # 30 days

#
# Interfaces
#

# TODO: kill this once we can use cairo's syscall for getting own address
@contract_interface
namespace IMirror:
    func get_my_address() -> (res : felt):
    end
end

#
# Profile type
#

struct Profile:
    member cid : felt  # cidv1 for profile pic/video/etc
    member address : felt  # starknet address
    member submitter_address : felt
    member submission_timestamp : felt
    member is_notarized : felt
end

#
# Storage vars
#

# Temporary: will be replaced by syscall / clock contract
@storage_var
func _timestamp() -> (res : felt):
end

# Temporary: will be replaced by a syscall
@storage_var
func _self_address() -> (res : felt):
end

# XXX: fn for admin to change the notary address
# The protocol is designed to degrade gracefully if the notary misbehaves
@storage_var
func _notary_address() -> (res : felt):
end

# XXX: fn for changing adjudicator address
# The protocol is designed to degrade gracefully if the adjudicator misbehaves
@storage_var
func _adjudicator_address() -> (res : felt):
end

@storage_var
func _super_adjudicator_l1_address() -> (res : felt):
end

# Admin has limited privileges: they can only modify the notary and adjudicator addresses
@storage_var
func _admin_address() -> (res : felt):
end

# Address of the ERC20 token we use for deposits/rewards
@storage_var
func _token_address() -> (res : felt):
end

@storage_var
func _num_profiles() -> (res : felt):
end

# Internal accounting: record how much of our balance is due to challenge
# deposits, submission deposits, etc so we don't accidentally give out people's
# deposits as rewards. (It should be possible for the shared security pool to
# be drained w/o revoking people's deposits.)
@storage_var
func _reserved_balance() -> (res : felt):
end

@storage_var
func _profiles(profile_id : felt) -> (res : Profile):
end

@storage_var
func _challenges(profile_id : felt, challenge_storage_index : felt) -> (res : felt):
end

# Map from starknet address to `profile_id`
@storage_var
func _map_address_to_profile_id(address : felt) -> (profile_id : felt):
end

#
# Challenge types & helpers
#

# Abusing a struct as an enum
# This struct just offers named indices
struct ChallengeStorageEnum:
    member last_recorded_status : felt  # one of ChallengeStatusEnum

    # Set in same tx that shifts `last_recorded_status` to `challenged`:
    member challenge_timestamp : felt  # nonzero iff there was a challenge
    member challenger_address : felt
    member challenge_evidence_cid : felt

    # Optionally set while `last_recorded_status` is `challenged`:
    member profile_owner_evidence_cid : felt

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

# Abusing a struct as an enum
struct ChallengeStatusEnum:
    member not_challenged : felt  # intentionally has an index of `0` (unset memory); thus challenge storage that has never been set will denote not_challenged
    member challenged : felt
    member adjudicated : felt
    member adjudication_opportunity_expired : felt
    member appealed : felt
    member appeal_opportunity_expired : felt
    member super_adjudicated : felt
    member super_adjudication_opportunity_expired : felt
    member settled : felt  # rewards/deposits/etc have been disbursed
end

func _get_did_adjudication_occur{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : felt):
    let (adjudication_timestamp) = _challenges.read(
        profile_id, ChallengeStorageEnum.adjudication_timestamp)
    if adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_appeal_occur{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : felt):
    let (appeal_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.appeal_timestamp)
    if appeal_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_super_adjudication_occur{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(profile_id : felt) -> (
        res : felt):
    let (super_adjudication_timestamp) = _challenges.read(
        profile_id, ChallengeStorageEnum.super_adjudication_timestamp)
    if super_adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _reset_challenge{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt):
    return _inner_reset_challenge(profile_id, 0)
end

func _inner_reset_challenge{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, i : felt):
    if i == ChallengeStorageEnum.SIZE:
        return ()
    end
    _challenges.write(profile_id, i, 0)
    return _inner_reset_challenge(profile_id, i + 1)
end

#
# Constructor
#

@constructor
func constructor{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        admin_address : felt, notary_address : felt, adjudicator_address : felt,
        super_adjudicator_l1_address : felt, token_address : felt, mirror_address : felt):
    _admin_address.write(admin_address)
    _notary_address.write(notary_address)
    _adjudicator_address.write(adjudicator_address)
    _super_adjudicator_l1_address.write(super_adjudicator_l1_address)
    _token_address.write(token_address)

    let (self_address) = IMirror.get_my_address(contract_address=mirror_address)
    _self_address.write(self_address)

    return ()
end

#
# Contract administration mutators
#

@external
func update_admin_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_is_caller_admin()
    _admin_address.write(new_address)
    return ()
end

@external
func update_notary_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_is_caller_admin()
    _notary_address.write(new_address)
    return ()
end

@external
func update_adjudicator_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_is_caller_admin()
    _adjudicator_address.write(new_address)
    return ()
end

@external
func update_super_adjudicator_l1_address{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(new_address : felt):
    assert_is_caller_admin()
    _super_adjudicator_l1_address.write(new_address)
    return ()
end

#
# Profile/challenge mutators
#

@external
func submit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        cid : felt, address : felt) -> (profile_id : felt):
    alloc_locals
    assert_not_zero(cid)
    assert_not_zero(address)
    assert_is_unused_address(address)

    let (local caller_address) = get_caller_address()
    let (now) = _timestamp.read()

    _receive_deposit(caller_address, SUBMISSION_DEPOSIT_SIZE)

    let (num_profiles) = _num_profiles.read()
    let profile_id = num_profiles + 1
    _num_profiles.write(profile_id)

    let (is_caller_notary) = get_is_caller_notary()
    let profile = Profile(
        cid=cid,
        address=address,
        submitter_address=caller_address,
        submission_timestamp=now,
        is_notarized=is_caller_notary)

    _profiles.write(profile_id, profile)
    _map_address_to_profile_id.write(address, profile_id)

    return (profile_id=profile_id)
end

# Notarizes a profile that wasn't submitted by a notary to begin with
@external
func notarize{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(profile_id : felt):
    alloc_locals

    # Only notaries can notarize
    assert_is_caller_notary()

    # only notarize profiles that exist
    assert_profile_exists(profile_id)

    # Only notarize profiles that aren't already notarized
    let (local profile : Profile) = get_profile(profile_id)
    assert profile.is_notarized = 0

    # Only notarize profiles that aren't challenged
    let (challenge_status) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.not_challenged

    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=1)
    _profiles.write(profile_id, new_profile)

    return ()
end

func challenge{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt):
    alloc_locals

    # Only challenge profiles that exist
    assert_profile_exists(profile_id)

    # Make way for this challenge by settling any existing challenge (if there is one, and if it can be settled)
    maybe_settle(profile_id)

    let (caller_address) = get_caller_address()
    let (status) = get_challenge_status(profile_id)

    # Only challenge prpfiles that are `not_challenged` or `settled`
    # See: https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#
    assert (status - ChallengeStatusEnum.not_challenged) * (status - ChallengeStatusEnum.settled) = 0

    # Only allow challenging of profiles that are confirmed or are still provisional
    # (In particular, don't allow challenging of profiles that are already invalid.)
    # XXX: verify this logic
    let (is_profile_confirmed) = get_is_profile_confirmed(profile_id)
    let (profile) = get_profile(profile_id)
    let (is_profile_provisional) = get_is_profile_provisional(profile)

    # is_profile_confirmed || is_profile_provisional
    assert (is_profile_confirmed - 1) * (is_profile_provisional - 1) = 0

    # Take a deposit from the challenger
    _receive_deposit(caller_address, CHALLENGE_DEPOSIT_SIZE)

    # If this profile was previously challenged, then clear out the old challenge information
    if status == ChallengeStatusEnum.settled:
        _reset_challenge(profile_id)
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
    else:
        tempvar syscall_ptr = syscall_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
    end

    let (now) = _timestamp.read()
    _challenges.write(
        profile_id, ChallengeStorageEnum.last_recorded_status, ChallengeStatusEnum.challenged)
    _challenges.write(profile_id, ChallengeStorageEnum.challenger_address, caller_address)
    _challenges.write(profile_id, ChallengeStorageEnum.challenge_evidence_cid, evidence_cid)
    _challenges.write(profile_id, ChallengeStorageEnum.challenge_timestamp, now)

    return ()
end

# Allows a profile owner to directly submit evidence on their own behalf
# Useful if the profile owner thinks that the adjudicator won't do a good job of defending their profile
# XXX: document limitation — there's nothing to prevent the adjudicator from adjudicating immediately to prevent evidence from being submitted by the profile owner. Maybe for now the appeal MetaEvidence policy can help handle this abusive case.
func submit_evidence{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt):
    alloc_locals
    let (local profile_id) = _get_caller_profile_id()
    let (challenge_status) = get_challenge_status(profile_id)

    # Can only submit evidence while challenge status is `challenged` (i.e. before adjudication)
    assert challenge_status = ChallengeStatusEnum.challenged

    _challenges.write(profile_id, ChallengeStorageEnum.profile_owner_evidence_cid, evidence_cid)
    return ()
end

func adjudicate{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt, should_confirm_profile : felt):
    assert_is_caller_adjudicator()
    assert_profile_exists(profile_id)
    assert_is_boolean(should_confirm_profile)

    # Only adjudicate things that are `challenged`
    let (challenge_status) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.challenged

    let (now) = _timestamp.read()
    _challenges.write(
        profile_id, ChallengeStorageEnum.last_recorded_status, ChallengeStatusEnum.adjudicated)
    _challenges.write(profile_id, ChallengeStorageEnum.adjudication_timestamp, now)
    _challenges.write(profile_id, ChallengeStorageEnum.adjudicator_evidence_cid, evidence_cid)
    _challenges.write(
        profile_id, ChallengeStorageEnum.did_adjudicator_confirm_profile, should_confirm_profile)

    return ()
end

@l1_handler
func appeal{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address : felt, profile_id : felt):
    let (super_adjudicator_l1_address) = _super_adjudicator_l1_address.read()
    assert from_address = super_adjudicator_l1_address

    # Only appeal things that are `adjudicated` or `adjudication_opportunity_expired`
    let (challenge_status) = get_challenge_status(profile_id)
    assert (challenge_status - ChallengeStatusEnum.adjudicated) * (challenge_status - ChallengeStatusEnum.adjudication_opportunity_expired) = 0

    let (now) = _timestamp.read()
    _challenges.write(
        profile_id, ChallengeStorageEnum.last_recorded_status, ChallengeStatusEnum.appealed)
    _challenges.write(profile_id, ChallengeStorageEnum.appeal_timestamp, now)

    return ()
end

@l1_handler
func super_adjudicate{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address : felt, profile_id : felt, should_confirm_profile : felt):
    let (super_adjudicator_l1_address) = _super_adjudicator_l1_address.read()
    assert from_address = super_adjudicator_l1_address

    assert_is_boolean(should_confirm_profile)

    # Only super adjudicate things that are `appealed`
    let (challenge_status) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.appealed

    let (now) = _timestamp.read()

    _challenges.write(
        profile_id,
        ChallengeStorageEnum.last_recorded_status,
        ChallengeStatusEnum.super_adjudicated)
    _challenges.write(profile_id, ChallengeStorageEnum.super_adjudication_timestamp, now)
    _challenges.write(
        profile_id,
        ChallengeStorageEnum.did_super_adjudicator_confirm_profile,
        should_confirm_profile)

    return ()
end

# XXX: need to handle case where submitter's deposit was vs. wasn't already returned
# XXX: verify logic
@external
func maybe_settle{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt):
    alloc_locals
    # A profile can be challegned iff its status is one of the following
    # See: https://lucid.app/lucidchart/df9f25d3-d9b0-4d0a-99d1-b1eac42eff3b/edit?viewport_loc=-1482%2C-119%2C4778%2C2436%2C0_0&invitationId=inv_56861740-601a-4a1e-8d61-58c60906253d

    let (status) = get_challenge_status(profile_id)
    let res = (status - ChallengeStatusEnum.appeal_opportunity_expired) *
        (status - ChallengeStatusEnum.super_adjudicated) *
        (status - ChallengeStatusEnum.super_adjudication_opportunity_expired)

    if res == 0:
        # Learn the final outcome of the challenge
        let (local is_profile_confirmed) = get_is_profile_confirmed(profile_id)
        let (profile) = get_profile(profile_id)

        if is_profile_confirmed == 1:
            # The challenger was wrong: take their deposit
            _swallow_deposit(CHALLENGE_DEPOSIT_SIZE)
        else:
            # The submitter was wrong: take their deposit
            _swallow_deposit(SUBMISSION_DEPOSIT_SIZE)

            let (challenger_address) = _challenges.read(
                profile_id, ChallengeStorageEnum.challenger_address)

            # The challenger was right: return their deposit and reward them
            _return_deposit(challenger_address, CHALLENGE_DEPOSIT_SIZE)
            _give_reward(challenger_address, SUBMISSION_DEPOSIT_SIZE)
        end

        _challenges.write(
            profile_id, ChallengeStorageEnum.last_recorded_status, ChallengeStatusEnum.settled)
        tempvar pedersen_ptr = pedersen_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        tempvar pedersen_ptr = pedersen_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    return ()
end

#
# Accessors
#

@view
func get_num_profiles{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (
        res : felt):
    let (num_profiles) = _num_profiles.read()
    return (num_profiles)
end

# automatically follows the gray lines on this chart, recursively:
# https://lucid.app/lucidchart/df9f25d3-d9b0-4d0a-99d1-b1eac42eff3b/edit?viewport_loc=-1482%2C-119%2C4778%2C2436%2C0_0&invitationId=inv_56861740-601a-4a1e-8d61-58c60906253d
@view
func get_challenge_status{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id) -> (status : felt):
    alloc_locals
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr : felt = range_check_ptr
    local syscall_ptr : felt* = syscall_ptr

    let (now) = _timestamp.read()
    let (last_recorded_status) = _challenges.read(
        profile_id, ChallengeStorageEnum.last_recorded_status)

    #
    # Not challenged
    #

    if last_recorded_status == ChallengeStatusEnum.not_challenged:
        return (ChallengeStatusEnum.not_challenged)
    end

    #
    # Challenged
    #

    if last_recorded_status == ChallengeStatusEnum.challenged:
        let (challenge_timestamp) = _challenges.read(
            profile_id, ChallengeStorageEnum.challenge_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - challenge_timestamp

        # Potentially auto-advance all the way to `appeal_opportunity_expired`
        let (has_appeal_opportunity_expired) = is_le(
            ADJUDICATION_TIME_WINDOW + APPEAL_TIME_WINDOW, time_passed)
        if has_appeal_opportunity_expired == 1:
            return (ChallengeStatusEnum.appeal_opportunity_expired)
        end

        # Potentially auto-advance to `adjudication_opportunity_expired`
        let (has_adjudication_opportunity_expired) = is_le(ADJUDICATION_TIME_WINDOW, time_passed)
        if has_adjudication_opportunity_expired == 1:
            return (ChallengeStatusEnum.adjudication_opportunity_expired)
        end

        return (ChallengeStatusEnum.challenged)
    end

    #
    # Adjudicated
    #

    if last_recorded_status == ChallengeStatusEnum.adjudicated:
        let (adjudication_timestamp) = _challenges.read(
            profile_id, ChallengeStorageEnum.adjudication_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - adjudication_timestamp

        # Potentially auto-advance to `appeal_opportunity_expired`
        let (has_appeal_opportunity_expired) = is_le(APPEAL_TIME_WINDOW, time_passed)
        if has_appeal_opportunity_expired == 1:
            return (ChallengeStatusEnum.appeal_opportunity_expired)
        end

        return (ChallengeStatusEnum.adjudicated)
    end

    #
    # Appealed
    #

    if last_recorded_status == ChallengeStatusEnum.appealed:
        let (appeal_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.appeal_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - appeal_timestamp

        # Potentially auto-advance to `super_adjudication_opportunity_expired`
        let (has_super_adjudication_opportunity_expired) = is_le(
            SUPER_ADJUDICATION_TIME_WINDOW, time_passed)
        if has_super_adjudication_opportunity_expired == 1:
            return (ChallengeStatusEnum.super_adjudication_opportunity_expired)
        end

        return (ChallengeStatusEnum.appealed)
    end

    #
    # Super adjudicated
    #

    if last_recorded_status == ChallengeStatusEnum.super_adjudicated:
        return (ChallengeStatusEnum.super_adjudicated)
    end

    #
    # Settled
    #

    if last_recorded_status == ChallengeStatusEnum.settled:
        return (ChallengeStatusEnum.settled)
    end

    assert 0 = 1  # Should be unreachable
    return (0)
end

@view
func get_is_profile_confirmed{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : felt):
    alloc_locals
    let (challenge_status) = get_challenge_status(profile_id)

    #
    # Status is `not_challenged`
    #

    if challenge_status == ChallengeStatusEnum.not_challenged:
        # confirmed if notarized OR survived provisional period without being challenged
        let (local profile : Profile) = get_profile(profile_id)
        let (is_provisional) = get_is_profile_provisional(profile)

        # is_notarized || !is_provisional
        if (profile.is_notarized - 1) * is_provisional == 0:
            return (1)
        else:
            return (0)
        end
    end

    #
    # All other statuses, e.g. `challenged`, `adjudicated`, ...
    #

    # Logic:
    # 1. A super adjudiciation is determinative
    # 2. Absent that, adjudication is determinative
    # 3. Absent that, presume innocence or not depending on whether the profile was still provisional when it was challenged

    let (did_super_adjudication_occur) = _get_did_super_adjudication_occur(profile_id)
    if did_super_adjudication_occur == 1:
        let (res) = _challenges.read(
            profile_id, ChallengeStorageEnum.did_super_adjudicator_confirm_profile)
        return (res)
    end

    let (did_adjudication_occur) = _get_did_adjudication_occur(profile_id)
    if did_adjudication_occur == 1:
        let (res) = _challenges.read(
            profile_id, ChallengeStorageEnum.did_adjudicator_confirm_profile)
        return (res)
    end

    let (profile) = get_profile(profile_id)
    let (challenge_timestamp) = _challenges.read(
        profile_id, ChallengeStorageEnum.challenge_timestamp)
    let (is_presumed_innocent) = is_le(
        PROVISIONAL_TIME_WINDOW, challenge_timestamp - profile.submission_timestamp)

    # XXX: consider a case where the adjudicator and the super adjudicator both time out...
    # Super edge case, but maybe we should side with the challenger in that case?

    return (is_presumed_innocent)
end

@view
func get_is_address_confirmed{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt) -> (res : felt):
    let (profile_id) = _map_address_to_profile_id.read(address)
    assert_not_zero(profile_id)
    let (res) = get_is_profile_confirmed(profile_id)
    return (res)
end

@view
func get_profile{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : Profile):
    let (profile) = _profiles.read(profile_id)
    assert_not_zero(profile.cid)
    return (profile)
end

@view
func get_profile_by_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt) -> (profile_id : felt, profile : Profile):
    let (profile_id) = _map_address_to_profile_id.read(address)
    assert_not_zero(profile_id)
    let (profile) = _profiles.read(profile_id)
    assert_not_zero(profile.cid)
    return (profile_id, profile)
end

# TODO: rename the provisional concept to be more concrete, e.g. is in provisional time window
func get_is_profile_provisional{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile) -> (res : felt):
    alloc_locals
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    let (now) = _timestamp.read()
    let (res) = is_le(now - profile.submission_timestamp, PROVISIONAL_TIME_WINDOW)
    return (res)
end

@view
func get_amount_available_for_challenge_rewards{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (res : felt):
    let (token_address) = _token_address.read()
    let (self_address) = _self_address.read()
    let (reserved_balance) = _reserved_balance.read()

    # Any funds that aren't challenge deposit reserves are for the security reward pool
    let (total_funds) = IERC20.balance_of(contract_address=token_address, account=self_address)
    return (total_funds.low - reserved_balance)
end

@view
func export_profile_by_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (profile : Profile, challenge : ChallengeStorageEnum):
    alloc_locals
    let (profile) = get_profile(profile_id)

    # An array of felts
    let (challenge_storage : felt*) = alloc()

    # Populate array of felts
    _load_challenge_felts(challenge_storage, profile_id, 0)

    # Abusing ChallengeStatusEnum as an actual struct (instead of an enum)
    let challenge_storage_ptr : ChallengeStorageEnum* = cast(challenge_storage, ChallengeStorageEnum*)

    return (profile, [challenge_storage_ptr])
end

func _load_challenge_felts{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        challenge_storage : felt*, profile_id, i):
    if i == ChallengeStorageEnum.SIZE:
        return ()
    end
    let (value) = _challenges.read(profile_id, i)
    assert challenge_storage[i] = value  # set challenge_storage[i]
    return _load_challenge_felts(challenge_storage, profile_id, i + 1)
end

#
# Treasury
#

func _receive_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address, amount):
    let (token_address) = _token_address.read()
    let (self_address) = _self_address.read()

    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance + amount)

    IERC20.transfer_from(
        contract_address=token_address,
        sender=from_address,
        recipient=self_address,
        amount=Uint256(amount, 0))

    return ()
end

func _return_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        to_address, amount):
    let (token_address) = _token_address.read()
    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance - amount)
    IERC20.transfer(contract_address=token_address, recipient=to_address, amount=Uint256(amount, 0))

    return ()
end

func _swallow_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        amount : felt):
    # Reduce reserved balance by the amount of the deposit that we're swallowing.
    # This has the effect of freeing up the tokens to be used for challenge rewards.
    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance - amount)

    return ()
end

func _give_reward{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address, amount : felt):
    alloc_locals

    # Determine if we have funds
    let (amount_available_for_challenge_rewards) = get_amount_available_for_challenge_rewards()

    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    local syscall_ptr : felt* = syscall_ptr

    let (has_funds_for_reward) = is_le(amount, amount_available_for_challenge_rewards)

    if has_funds_for_reward != 0:
        let (token_address) = _token_address.read()
        IERC20.transfer(contract_address=token_address, recipient=amount, amount=Uint256(amount, 0))

        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    return ()
end

#
# Roles and guards
#

func _get_caller_profile_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        ) -> (profile_id : felt):
    let (caller_address) = get_caller_address()
    let (profile_id) = _map_address_to_profile_id.read(caller_address)
    assert_not_zero(profile_id)
    return (profile_id)
end

func get_is_caller_notary{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (
        res : felt):
    let (caller_address) = get_caller_address()
    let (notary_address) = _notary_address.read()
    let (is_notary) = get_is_equal(notary_address, caller_address)
    return (is_notary)
end

func assert_is_caller_notary{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (is_notary) = get_is_caller_notary()
    assert is_notary = 1
    return ()
end

func assert_is_caller_adjudicator{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (adjudicator_address) = _adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert caller_address = adjudicator_address
    return ()
end

func assert_is_caller_admin{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (caller_address) = get_caller_address()
    let (admin_address) = _admin_address.read()
    let (res) = get_is_equal(admin_address, caller_address)
    assert res = 1
    return ()
end

@view
func assert_is_unused_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt):
    let (profile_id) = _map_address_to_profile_id.read(address)
    assert profile_id = 0
    return ()
end

@view
func assert_profile_exists{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt):
    # Getting a profile asserts its existence
    let (_ : felt) = get_profile(profile_id)
    return ()
end

@view
func get_token_address{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
        token_address : felt):
    return _token_address.read()
end

@view
func get_submission_deposit_size() -> (res : felt):
    return (SUBMISSION_DEPOSIT_SIZE)
end

@view
func get_challenge_deposit_size() -> (res : felt):
    return (CHALLENGE_DEPOSIT_SIZE)
end

func assert_is_boolean{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(x : felt):
    # x == 0 || x == 1
    assert ((x - 1) * x) = 0
    return ()
end

func get_is_equal{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        a : felt, b : felt) -> (res : felt):
    if a == b:
        return (1)
    else:
        return (0)
    end
end
