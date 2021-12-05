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
    _get_did_super_adjudication_occur, _get_is_in_provisional_time_window, _get_is_confirmed)

#
# Storage vars
#

@storage_var
func _is_in_test_mode() -> (res : felt):
end

# Temporary: will be replaced by syscall / clock contract
@storage_var
func _timestamp() -> (res : felt):
end

# The protocol is designed to degrade gracefully if the notary misbehaves
@storage_var
func _notary_address() -> (res : felt):
end

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

# Internal accounting: challenge deposits + submission deposits
@storage_var
func _deposit_balance() -> (res : felt):
end

# Internal accounting: balance for secury bounties
@storage_var
func _security_pool_balance() -> (res : felt):
end

@storage_var
func _profiles(profile_id : felt) -> (res : Profile):
end

# Map from profile_id to a `1` iff submission deposit was spent
@storage_var
func _submission_deposit_spends(profile_id : felt) -> (res : felt):
end

# Map from address to `profile_id`
@storage_var
func _map_address_to_profile_id(address : felt) -> (profile_id : felt):
end

#
# Constructor
#

@constructor
func constructor{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        is_in_test_mode : felt, admin_address : felt, notary_address : felt,
        adjudicator_address : felt, super_adjudicator_l1_address : felt, token_address : felt):
    _is_in_test_mode.write(is_in_test_mode)
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
    let (local profile : Profile) = get_profile_by_id(profile_id)
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
        did_adjudicator_confirm_profile=profile.did_adjudicator_confirm_profile,
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

    let (profile) = get_profile_by_id(profile_id)
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)

    # Only challenge profiles that are `not_challenged` or `settled`
    assert (status - StatusEnum.NOT_CHALLENGED) * (status - StatusEnum.SETTLED) = 0

    # Prevent rechallenging of profiles that have already been deemed invalid
    if status == StatusEnum.SETTLED:
        let (is_confirmed) = _get_is_confirmed(profile, now)
        assert is_confirmed = 1

        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    # Take a deposit from the challenger
    _receive_deposit(caller_address, consts.CHALLENGE_DEPOSIT_SIZE)

    # We could be challenging a profile that was previously settled and thus has
    # old challenge information lying around, so specifically zero out challenge
    # information
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
# Note: a corrupt adjudicator could adjudicate immediately in order to prevent the profile owner from submitting evidence.
# This limitation is documented and will be fixed in a future version.
@external
func submit_evidence{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt, evidence_cid : felt):
    alloc_locals
    let (local profile_id) = get_caller_profile_id()

    let (now) = _timestamp.read()
    let (profile) = get_profile_by_id(profile_id)
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
        did_adjudicator_confirm_profile=profile.did_adjudicator_confirm_profile,
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

    let (local profile) = get_profile_by_id(profile_id)

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

    let (local profile) = get_profile_by_id(profile_id)

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
        did_adjudicator_confirm_profile=profile.did_adjudicator_confirm_profile,
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

    let (local profile) = get_profile_by_id(profile_id)

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
        did_adjudicator_confirm_profile=profile.did_adjudicator_confirm_profile,
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=now,  # Changed
        did_super_adjudicator_confirm_profile=should_confirm_profile  # Changed
        ))

    maybe_settle(profile_id)

    return ()
end

@external
func maybe_return_submission_deposit{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(profile_id : felt):
    alloc_locals
    let (now) = _timestamp.read()
    let (profile) = get_profile_by_id(profile_id)

    # Hold deposit in reserve until profile is outside of its provisional time window
    let (is_in_provisional_time_window) = _get_is_in_provisional_time_window(profile, now)
    if is_in_provisional_time_window == 1:
        return ()
    end

    # Hold deposit if profile isn't confirmed (due to being challenged, etc)
    let (is_confirmed) = _get_is_confirmed(profile, now)
    if is_confirmed == 1:
        return ()
    end

    let (submission_deposit_size) = get_submission_deposit_size(profile.submission_timestamp)
    _return_submission_deposit_if_unspent(
        profile_id, profile.submitter_address, submission_deposit_size)

    return ()
end

@external
func maybe_settle{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt):
    alloc_locals

    let (profile) = get_profile_by_id(profile_id)
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    let res = (status - StatusEnum.APPEAL_OPPORTUNITY_EXPIRED) * (status - StatusEnum.SUPER_ADJUDICATION_ROUND_COMPLETED)

    # Only settle if appeal opportunity expired or if adjudication round is complete
    if res != 0:
        return ()
    end

    let (submission_deposit_size) = get_submission_deposit_size(profile.submission_timestamp)
    let (challenge_deposit_size) = get_challenge_deposit_size(profile.challenge_timestamp)

    # Learn the final outcome of the challenge
    let (did_challenger_lose) = _get_is_confirmed(profile, now)

    if did_challenger_lose == 1:
        _return_submission_deposit_if_unspent(
            profile_id, profile.submitter_address, submission_deposit_size)
        _swallow_deposit(challenge_deposit_size)  # swallow challenger's deposit
    else:
        _swallow_submission_deposit_if_unspent(profile_id, submission_deposit_size)
        _return_deposit(profile.challenger_address, challenge_deposit_size)  # return challenger's deposit

        # Reward challenger
        let (challenge_reward_size) = get_challenge_reward_size(profile.challenge_timestamp)
        _maybe_give_security_bounty(profile.challenger_address, challenge_reward_size)
    end

    # Set `last_recorded_status` to `SETTLED`
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
        did_adjudicator_confirm_profile=profile.did_adjudicator_confirm_profile,
        appeal_timestamp=profile.appeal_timestamp,
        super_adjudication_timestamp=profile.super_adjudication_timestamp,
        did_super_adjudicator_confirm_profile=profile.did_super_adjudicator_confirm_profile
        ))

    return ()
end

#
# Treasury management
#

@external
func donate_to_security_pool{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        amount : felt):
    let (caller_address) = get_caller_address()
    let (token_address) = _token_address.read()
    let (self_address) = get_contract_address()
    IERC20.transfer_from(
        contract_address=token_address,
        sender=caller_address,
        recipient=self_address,
        amount=Uint256(amount, 0))
    let (security_pool_balance) = _security_pool_balance.read()
    _security_pool_balance.write(security_pool_balance + amount)
    return ()
end

func _return_submission_deposit_if_unspent{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id, submitter_address, amount):
    let (was_submission_deposit_spent) = _submission_deposit_spends.read(profile_id)

    if was_submission_deposit_spent == 0:
        _return_deposit(submitter_address, amount)
        _submission_deposit_spends.write(profile_id, 1)

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

func _swallow_submission_deposit_if_unspent{
        pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(profile_id, amount):
    let (was_submission_deposit_spent) = _submission_deposit_spends.read(profile_id)

    if was_submission_deposit_spent == 0:
        _swallow_deposit(amount)
        _submission_deposit_spends.write(profile_id, 1)
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

func _receive_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        from_address, amount):
    let (token_address) = _token_address.read()
    let (self_address) = get_contract_address()

    let (deposit_balance) = _deposit_balance.read()
    _deposit_balance.write(deposit_balance + amount)

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
    let (deposit_balance) = _deposit_balance.read()
    _deposit_balance.write(deposit_balance - amount)
    IERC20.transfer(contract_address=token_address, recipient=to_address, amount=Uint256(amount, 0))

    return ()
end

func _swallow_deposit{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        amount : felt):
    let (deposit_balance) = _deposit_balance.read()
    _deposit_balance.write(deposit_balance - amount)

    let (security_pool_balance) = _security_pool_balance.read()
    _security_pool_balance.write(security_pool_balance + amount)

    return ()
end

func _maybe_give_security_bounty{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address, amount : felt):
    alloc_locals

    let (security_pool_balance) = _security_pool_balance.read()

    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    local syscall_ptr : felt* = syscall_ptr

    let (has_funds_for_reward) = is_le(amount, security_pool_balance)

    if has_funds_for_reward != 0:
        let (token_address) = _token_address.read()
        IERC20.transfer(contract_address=token_address, recipient=amount, amount=Uint256(amount, 0))
        _security_pool_balance.write(security_pool_balance - amount)

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
# Views
#

@view
func get_token_address{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}() -> (
        token_address : felt):
    return _token_address.read()
end

@view
func get_security_pool_balance{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        ) -> (res : felt):
    let (balance) = _security_pool_balance.read()
    return (balance)
end

@view
func get_submission_deposit_size(timestamp : felt) -> (res : felt):
    # Constant for now, but later may depend on time
    return (consts.SUBMISSION_DEPOSIT_SIZE)
end

@view
func get_challenge_deposit_size(timestamp : felt) -> (res : felt):
    # Constant for now, but later may depend on time
    return (consts.CHALLENGE_DEPOSIT_SIZE)
end

@view
func get_challenge_reward_size(timestamp : felt) -> (res : felt):
    # Constant for now, but later may depend on time
    return (consts.CHALLENGE_REWARD_SIZE)
end

@view
func get_time_windows() -> (
        PROVISIONAL_TIME_WINDOW : felt, ADJUDICATION_TIME_WINDOW : felt, APPEAL_TIME_WINDOW : felt,
        SUPER_ADJUDICATION_TIME_WINDOW : felt):
    return (
        consts.PROVISIONAL_TIME_WINDOW,
        consts.ADJUDICATION_TIME_WINDOW,
        consts.APPEAL_TIME_WINDOW,
        consts.SUPER_ADJUDICATION_TIME_WINDOW)
end

@view
func get_profile_by_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (res : Profile):
    let (profile) = _profiles.read(profile_id)
    assert_not_zero(profile.cid)  # Ensure profile exists
    return (profile)
end

@view
func get_profile_by_address{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt) -> (profile_id : felt, profile : Profile):
    let (profile_id) = _map_address_to_profile_id.read(address)
    let (profile) = get_profile_by_id(profile_id)
    return (profile_id, profile)
end

@view
func get_num_profiles{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (
        res : felt):
    let (num_profiles) = _num_profiles.read()
    return (num_profiles)
end

@view
func get_is_confirmed{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        address : felt) -> (res : felt):
    let (profile_id) = _map_address_to_profile_id.read(address)
    let (profile) = get_profile_by_id(profile_id)
    let (now) = _timestamp.read()
    let (is_confirmed) = _get_is_confirmed(profile, now)
    return (is_confirmed)
end

# For syncing and testing
@view
func export_profile_by_id{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        profile_id : felt) -> (profile : Profile, num_profiles : felt, status : felt):
    alloc_locals
    let (profile) = get_profile_by_id(profile_id)
    let (num_profiles) = get_num_profiles()
    let (now) = _timestamp.read()
    let (status) = _get_current_status(profile, now)
    return (profile, num_profiles, status)
end

#
# Caller information
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

#
# Guards
#

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

#
# Test hooks
#

@external
func _test_advance_clock{pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}(
        duration):
    let (is_in_test_mode) = _is_in_test_mode.read()
    assert is_in_test_mode = 1
    let (now) = _timestamp.read()
    _timestamp.write(now + duration)
    return ()
end
