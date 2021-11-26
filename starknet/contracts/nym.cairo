%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.registers import get_fp_and_pc
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.cairo.common.uint256 import Uint256
from starkware.starknet.common.syscalls import get_caller_address, get_contract_address

from OpenZeppelin.IERC20 import IERC20

from utils import assert_is_boolean, get_is_equal
from consts import consts
from profile import (
    Profile, StatusEnum, _get_current_status, _get_did_adjudication_occur,
    _get_did_super_adjudication_occur)

#
# Storage vars
#

# Temporary: will be replaced by syscall / clock contract
@storage_var
func _timestamp() -> (res : felt):
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
# Constructor
#

@constructor
func constructor{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        admin_address : felt, notary_address : felt, adjudicator_address : felt,
        super_adjudicator_l1_address : felt, token_address : felt):
    _admin_address.write(admin_address)
    _notary_address.write(notary_address)
    _adjudicator_address.write(adjudicator_address)
    _super_adjudicator_l1_address.write(super_adjudicator_l1_address)
    _token_address.write(token_address)

    _timestamp.write(123456789)

    return ()
end

#
# Administration
#

@external
func update_admin_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_caller_is_admin()
    _admin_address.write(new_address)
    return ()
end

@external
func update_notary_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_caller_is_admin()
    _notary_address.write(new_address)
    return ()
end

@external
func update_adjudicator_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        new_address : felt):
    assert_caller_is_admin()
    _adjudicator_address.write(new_address)
    return ()
end

@external
func update_super_adjudicator_l1_address{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(new_address : felt):
    assert_caller_is_admin()
    _super_adjudicator_l1_address.write(new_address)
    return ()
end

#
# Profile mutation
#

@external
func submit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        cid : felt, address : felt) -> (profile_id : felt):
    alloc_locals
    assert_not_zero(cid)
    assert_not_zero(address)
    assert_is_unused_address(address)

    # XXX: verify sig of address

    let (local caller_address) = get_caller_address()
    let (now) = _timestamp.read()

    _receive_deposit(caller_address, consts.SUBMISSION_DEPOSIT_SIZE)

    let (num_profiles) = _num_profiles.read()
    let profile_id = num_profiles + 1
    _num_profiles.write(profile_id)

    _map_address_to_profile_id.write(address, profile_id)

    let (is_caller_notary) = get_is_caller_notary()
    _profiles.write(
        profile_id,
        Profile(
        cid=cid,
        address=address,
        submitter_address=caller_address,
        submission_timestamp=now,
        is_notarized=is_caller_notary,
        last_recorded_status=StatusEnum.NOT_CHALLENGED,
        challenge_timestamp=0,
        challenger_address=0,
        challenge_evidence_cid=0,
        owner_evidence_cid=0,
        adjudication_timestamp=0,
        adjudicator_evidence_cid=0,
        did_adjudicator_confirm_profile=0,
        appeal_timestamp=0,
        super_adjudication_timestamp=0,
        did_super_adjudicator_confirm_profile=0
        ))

    return (profile_id=profile_id)
end

# Notarizes a profile that wasn't submitted by a notary to begin with
@external
func notarize{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(profile_id : felt):
    alloc_locals

    # Only notaries can notarize
    assert_caller_is_notary()

    # Only notarize profiles that aren't already notarized
    let (local profile : Profile) = get_profile(profile_id)
    assert profile.is_notarized = 0

    # Only notarize profiles that aren't challenged
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    assert status = StatusEnum.NOT_CHALLENGED

    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=1,  # Changed
        last_recorded_status=profile.last_recorded_status,
        challenge_timestamp=profile.challenge_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        owner_evidence_cid=profile.owner_evidence_cid,
        adjudication_timestamp=profile.adjudication_timestamp,
        adjudicator_evidence_cid=profile.adjudicator_evidence_cid,
        did_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile,
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=profile.super_adjudication_timestamp,
        did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
        ))

    return ()
end

@external
func challenge{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt):
    alloc_locals

    # Make way for this challenge by settling any existing challenge (if there is one, and if it can be settled)
    maybe_settle(profile_id)

    let (caller_address) = get_caller_address()

    let (profile) = get_profile(profile_id)
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)

    # Only challenge prpfiles that are `not_challenged` or `settled`
    # See: https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#
    assert (status - StatusEnum.NOT_CHALLENGED) * (status - StatusEnum.SETTLED) = 0

    # Only allow challenging of profiles that are confirmed or are still provisional
    # (In particular, don't allow challenging of profiles that are already invalid.)
    # XXX: verify this logic
    let (is_profile_confirmed) = get_is_profile_confirmed(profile_id)
    let (profile) = get_profile(profile_id)
    let (is_profile_provisional) = get_is_profile_provisional(profile)

    # is_profile_confirmed || is_profile_provisional
    assert (is_profile_confirmed - 1) * (is_profile_provisional - 1) = 0

    # Take a deposit from the challenger
    _receive_deposit(caller_address, consts.CHALLENGE_DEPOSIT_SIZE)

    # We could be challenging a profile that was previously settled and thus has old challenge information lying around, so specifically zero out challenge information
    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=profile.is_notarized,
        last_recorded_status=StatusEnum.CHALLENGED,  # Changed
        challenge_timestamp=now,  # Changed
        challenger_address=caller_address,  # Changed
        challenge_evidence_cid=evidence_cid,  # Changed
        owner_evidence_cid=0,  # Changed
        adjudication_timestamp=0,  # Changed
        adjudicator_evidence_cid=0,  # Changed
        did_adjudicator_confirm_profile=0,  # Changed
        appeal_timestamp=0,  # Changed
        super_adjudication_timestamp=0,  # Changed
        did_super_adjudicator_confirm_profile=0  # Changed
        ))

    return ()
end

# Allows a profile owner to directly submit evidence on their own behalf
# Useful if the profile owner thinks that the adjudicator won't do a good job of defending their profile
# XXX: document limitation — there's nothing to prevent the adjudicator from adjudicating immediately to prevent evidence from being submitted by the profile owner. Maybe for now the appeal MetaEvidence policy can help handle this abusive case.
@external
func submit_evidence{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt):
    alloc_locals
    let (local profile_id) = get_caller_profile_id()

    let (now) = _timestamp.read()
    let (profile) = get_profile(profile_id)
    let (status) = _get_current_status(profile, now)

    # Can only submit evidence while status is `challenged` (i.e. before adjudication)
    assert status = StatusEnum.CHALLENGED

    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=profile.is_notarized,
        last_recorded_status=profile.last_recorded_status,
        challenge_timestamp=profile.challenge_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        owner_evidence_cid=evidence_cid,  # Changed
        adjudication_timestamp=profile.adjudication_timestamp,
        adjudicator_evidence_cid=profile.adjudicator_evidence_cid,
        did_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile,
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=profile.super_adjudication_timestamp,
        did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
        ))
    return ()
end

@external
func adjudicate{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt, should_confirm_profile : felt):
    alloc_locals
    assert_caller_is_adjudicator()
    assert_is_boolean(should_confirm_profile)

    let (local profile) = get_profile(profile_id)

    # Only adjudicate things that are `challenged`
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    assert status = StatusEnum.CHALLENGED

    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=profile.is_notarized,
        last_recorded_status=StatusEnum.ADJUDICATION_ROUND_COMPLETED,  # Changed
        challenge_timestamp=profile.challenge_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        owner_evidence_cid=profile.owner_evidence_cid,
        adjudication_timestamp=now,  # Changed
        adjudicator_evidence_cid=evidence_cid,  # Changed
        did_adjudicator_confirm_profile=should_confirm_profile,  # Changed
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=profile.super_adjudication_timestamp,
        did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
        ))

    return ()
end

@l1_handler
func appeal{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address : felt, profile_id : felt):
    alloc_locals
    let (super_adjudicator_l1_address) = _super_adjudicator_l1_address.read()
    assert from_address = super_adjudicator_l1_address

    let (local profile) = get_profile(profile_id)

    # Only appeal if adjudication round is complete
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    assert (status - StatusEnum.ADJUDICATION_ROUND_COMPLETED) = 0

    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=profile.is_notarized,
        last_recorded_status=StatusEnum.APPEALED,  # Changed
        challenge_timestamp=profile.challenge_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        owner_evidence_cid=profile.owner_evidence_cid,
        adjudication_timestamp=profile.adjudication_timestamp,
        adjudicator_evidence_cid=profile.adjudicator_evidence_cid,
        did_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile,
        appeal_timestamp=now,  # Changed
        super_adjudication_timestamp=profile.super_adjudication_timestamp,
        did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
        ))

    return ()
end

@l1_handler
func super_adjudicate{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address : felt, profile_id : felt, should_confirm_profile : felt):
    alloc_locals
    let (super_adjudicator_l1_address) = _super_adjudicator_l1_address.read()
    assert from_address = super_adjudicator_l1_address
    assert_is_boolean(should_confirm_profile)

    let (local profile) = get_profile(profile_id)

    # Only super adjudicate things that are `appealed`
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    assert status = StatusEnum.APPEALED

    _profiles.write(
        profile_id,
        Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=profile.is_notarized,
        last_recorded_status=StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED,  # Changed
        challenge_timestamp=profile.challenge_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        owner_evidence_cid=profile.owner_evidence_cid,
        adjudication_timestamp=profile.adjudication_timestamp,
        adjudicator_evidence_cid=profile.adjudicator_evidence_cid,
        did_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile,
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=now,  # Changed
        did_super_adjudicator_confirm_profile=should_confirm_profile  # Changed
        ))

    maybe_settle(profile_id)

    return ()
end

# XXX: need to handle case where submitter's deposit was vs. wasn't already returned
# XXX: verify logic
@external
func maybe_settle{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt):
    alloc_locals

    let (profile) = get_profile(profile_id)
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    let res = (status - StatusEnum.APPEAL_OPPORTUNITY_EXPIRED) * (status - StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED)

    if res == 0:
        # Learn the final outcome of the challenge
        let (local is_profile_confirmed) = get_is_profile_confirmed(profile_id)

        if is_profile_confirmed == 1:
            # The challenger was wrong: take their deposit
            _swallow_deposit(consts.CHALLENGE_DEPOSIT_SIZE)
        else:
            # The submitter was wrong: take their deposit
            _swallow_deposit(consts.SUBMISSION_DEPOSIT_SIZE)

            # The challenger was right: return their deposit and reward them
            _return_deposit(profile.challenger_address, consts.CHALLENGE_DEPOSIT_SIZE)
            _give_reward(profile.challenger_address, consts.SUBMISSION_DEPOSIT_SIZE)
        end

        _profiles.write(
            profile_id,
            Profile(
            cid=profile.cid,
            address=profile.address,
            submitter_address=profile.submitter_address,
            submission_timestamp=profile.submission_timestamp,
            is_notarized=profile.is_notarized,
            last_recorded_status=StatusEnum.SETTLED,  # Changed
            challenge_timestamp=profile.challenge_timestamp,
            challenger_address=profile.challenger_address,
            challenge_evidence_cid=profile.challenge_evidence_cid,
            owner_evidence_cid=profile.owner_evidence_cid,
            adjudication_timestamp=profile.adjudication_timestamp,
            adjudicator_evidence_cid=profile.adjudicator_evidence_cid,
            did_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile,
            appeal_timestamp=profile.appeal_timestamp,
            super_adjudication_timestamp=profile.super_adjudication_timestamp,
            did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
            ))

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
# Treasury
#

func _receive_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address, amount):
    let (token_address) = _token_address.read()
    let (self_address) = get_contract_address()

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
# Accessors
#

@view
func get_num_profiles{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (
        res : felt):
    let (num_profiles) = _num_profiles.read()
    return (num_profiles)
end

@view
func get_current_status{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : felt):
    let (profile) = get_profile(profile_id)
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    return (status)
end

# TODO: move this over to types.cairo
@view
func get_is_profile_confirmed{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : felt):
    alloc_locals
    let (now) = _timestamp.read()
    let (profile) = get_profile(profile_id)
    let (status) = _get_current_status(profile, now)

    #
    # Status is `not_challenged`
    #

    if status == StatusEnum.NOT_CHALLENGED:
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

    let (did_super_adjudication_occur) = _get_did_super_adjudication_occur(profile)
    if did_super_adjudication_occur == 1:
        return (profile.did_super_adjudicator_confirm_profile)
    end

    let (did_adjudication_occur) = _get_did_adjudication_occur(profile)
    if did_adjudication_occur == 1:
        return (profile.did_adjudicator_confirm_profile)
    end

    let (is_presumed_innocent) = is_le(
        consts.PROVISIONAL_TIME_WINDOW, profile.challenge_timestamp - profile.submission_timestamp)

    # XXX: consider a case where the adjudicator and the super adjudicator both time out...
    # Super edge case, but we decided to side with the challenger in that case

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
    assert_not_zero(profile.cid)  # Ensure profile exists
    return (profile)
end

@view
func get_profile_by_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt) -> (profile_id : felt, profile : Profile):
    let (profile_id) = _map_address_to_profile_id.read(address)
    let (profile) = get_profile(profile_id)
    return (profile_id, profile)
end

# TODO: rename the provisional concept to be more concrete, e.g. is in provisional time window
func get_is_profile_provisional{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile : Profile) -> (res : felt):
    alloc_locals
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    let (now) = _timestamp.read()
    let (res) = is_le(now - profile.submission_timestamp, consts.PROVISIONAL_TIME_WINDOW)
    return (res)
end

@view
func get_amount_available_for_challenge_rewards{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (res : felt):
    let (token_address) = _token_address.read()
    let (self_address) = get_contract_address()
    let (reserved_balance) = _reserved_balance.read()

    # Any funds that aren't challenge deposit reserves are for the security reward pool
    let (total_funds) = IERC20.balance_of(contract_address=token_address, account=self_address)
    return (total_funds.low - reserved_balance)
end

@view
func export_profile_by_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (profile : Profile, num_profiles : felt):
    alloc_locals
    let (profile) = get_profile(profile_id)
    let (num_profiles) = _num_profiles.read()
    return (profile, num_profiles)
end

@view
func get_token_address{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
        token_address : felt):
    return _token_address.read()
end

@view
func get_submission_deposit_size() -> (res : felt):
    return (consts.SUBMISSION_DEPOSIT_SIZE)
end

@view
func get_challenge_deposit_size() -> (res : felt):
    return (consts.CHALLENGE_DEPOSIT_SIZE)
end

#
# Roles and guards
#

func get_caller_profile_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (
        profile_id : felt):
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

func assert_caller_is_notary{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (is_notary) = get_is_caller_notary()
    assert is_notary = 1
    return ()
end

func assert_caller_is_adjudicator{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (adjudicator_address) = _adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert caller_address = adjudicator_address
    return ()
end

func assert_caller_is_admin{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}():
    let (caller_address) = get_caller_address()
    let (admin_address) = _admin_address.read()
    let (res) = get_is_equal(admin_address, caller_address)
    assert res = 1
    return ()
end

func assert_is_unused_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt):
    let (profile_id) = _map_address_to_profile_id.read(address)
    assert profile_id = 0
    return ()
end
