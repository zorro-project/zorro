%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address

from OpenZepplin.IERC20 import IERC20

from types.cid import Cid, assert_cid_is_zero, assert_cid_is_not_zero
from types.profile import (
    Profile, ProfileStatusEnum, _get_is_profile_notarized, _get_did_profile_receive_deposit,
    _get_does_profile_have_unreturned_deposit)

#
# Constants
#

const CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in test.py
const CHALLENGE_REWARD_SIZE = 25  # This constant is also in test.py
const SUBMISSION_DEPOSIT_SIZE = 25
const TIMESTAMP = 0  # replace this with a dynamic standin for the syscall

const INITIAL_CHALLENGE_PERIOD = 9 * 24 * 60 * 60  # 9 days in seconds. TODO: come up with a better name

#
# Storage vars
#

@storage_var
func _is_initialized() -> (res : felt):
end

# There's no syscall yet for getting a contract's own address, so we store
# our own here and set it during initialization
@storage_var
func _self_address() -> (res : felt):
end

# Stores the address of the ERC20 token that we touch
@storage_var
func _token_address() -> (res : felt):
end

# Internal accounting: record how much of our balance is due to challenge
# deposits, submission deposits, etc so we don't accidentally give out people's
# deposits as rewards. (It should be possible for the shared security pool to
# be drained w/o revoking people's deposits.)
@storage_var
func _reserved_balance() -> (res : felt):
end

# TODO: in actuality, we want to maintain a list of valid notaries
@storage_var
func _notary_address() -> (res : felt):
end

@storage_var
func _adjudicator_address() -> (res : felt):
end

@storage_var
func _num_profiles() -> (res : felt):
end

# Maps from user's ethereum address to profile properties
# TODO: decide what we want the key to be (using eth address right now.)
# TODO: decide if want to map into some bigger struct that includes
# other information about the profile, like whether or not it is challenged, etc
@storage_var
func _profiles(profile_id : felt) -> (res : Profile):
end

# internal index mapping from starknet address to `profile_id`
# necessary for `get_is_person`
@storage_var
func _map_address_to_profile_id(address : felt) -> (profile_id : felt):
end

# internal index mapping from eth address to `profile_id`
# necessary for checking that an eth address isn't already in use while submitting
@storage_var
func _map_eth_address_to_profile_id(eth_address : felt) -> (profile_id : felt):
end

#
# Functions with side effects
#

@external
func initialize{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(
        notary_address : felt, adjudicator_address, self_address : felt, token_address : felt):
    let (is_initialized) = _is_initialized.read()
    assert is_initialized = 0
    _is_initialized.write(1)

    _notary_address.write(notary_address)
    _adjudicator_address.write(adjudicator_address)
    _self_address.write(self_address)
    _token_address.write(token_address)
    return ()
end

@external
func submit_with_notarization{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_cid : Cid, eth_address : felt, address : felt):
    assert_initialized()
    assert_caller_is_notary()
    let (notary_address) = get_caller_address()

    let (profile_id) = _submit(
        profile_cid=profile_cid,
        eth_address=eth_address,
        address=address,
        notary_address=notary_address,
        depositor_address=0)
    return ()
end

@external
func submit_with_deposit{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(
        profile_cid : Cid, eth_address : felt, address : felt, creation_timestamp : felt):
    alloc_locals
    assert_initialized()

    let (local caller_address) = get_caller_address()
    _receive_deposit(caller_address, SUBMISSION_DEPOSIT_SIZE)

    let (profile_id) = _submit(
        profile_cid=profile_cid,
        eth_address=eth_address,
        address=address,
        notary_address=0,
        depositor_address=caller_address)
    return ()
end

func _submit{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(
        profile_cid : Cid, eth_address : felt, address : felt, notary_address : felt,
        depositor_address : felt) -> (profile_id : felt):
    assert_cid_is_not_zero(profile_cid)
    assert_not_zero(eth_address)
    assert_not_zero(address)
    assert_eth_address_is_unused(eth_address)
    assert_address_is_unused(address)

    let (num_profiles) = _num_profiles.read()
    let profile_id = num_profiles + 1
    _num_profiles.write(profile_id)

    # XXX: The ethereum address should sign the cid, and we should verify that
    # signature here. Otherwise, someone could claim someone else's eth address,
    # which could lead to confusion. Also, they could grief the owner of the eth
    # address by submitting an invalid profile to lock them out of proving their
    # personhood with that eth address.

    # XXX: Starknet doesn't yet have a timestamp opcode, but according to them
    # it's hopefully coming in a few weeks For now, we can trust the notary to
    # include it accurately, and the profile could be challenged if it is not
    # accurate.
    let profile = Profile(
        cid=profile_cid,
        address=address,
        eth_address=eth_address,
        status=ProfileStatusEnum.submitted,
        notary_address=notary_address,
        depositor_address=depositor_address,
        creation_timestamp=TIMESTAMP,
        challenger_address=0,
        challenge_evidence_cid=Cid(0, 0),
        challenge_creation_timestamp=0,
        appellant_addres=0)

    _profiles.write(profile_id, profile)
    _map_address_to_profile_id.write(address, profile_id)
    _map_eth_address_to_profile_id.write(eth_address, profile_id)

    return (profile_id)
end

@external
func notarize{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt):
    alloc_locals
    assert_initialized()
    assert_caller_is_notary()
    let (local caller_address) = get_caller_address()
    let (local profile : Profile) = get_profile(profile_id)

    # Only profiles in the submitted state can be notarized
    assert profile.status = ProfileStatusEnum.submitted

    # Ensure not already notarized
    let (is_profile_notarized) = _get_is_profile_notarized(profile)
    assert is_profile_notarized = 0

    # Invariant check: a profile is either submitted with a deposit or with notarization
    # Therefore, if it's not notarized yet, it must have a deposit:
    let (did_profile_receive_deposit) = _get_did_profile_receive_deposit(profile)
    assert did_profile_receive_deposit = 1

    _return_deposit(profile.depositor_address, CHALLENGE_DEPOSIT_SIZE)

    # Update profile.notary_address
    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        eth_address=profile.eth_address,
        status=profile.status,
        notary_address=caller_address,
        depositor_address=profile.depositor_address,
        creation_timestamp=profile.creation_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        challenge_creation_timestamp=profile.challenge_creation_timestamp,
        appellant_address=profile.appellant_address)
    _profiles.write(profile_id, new_profile)
    return ()
end

@external
func challenge{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt, evidence_cid : Cid):
    alloc_locals
    assert_initialized()

    let (local profile) = get_profile(profile_id)
    let (local caller_address) = get_caller_address()

    # A profile can be challegned iff its status is one of 'submitted' or 'kleros_deemed_valid'.
    assert (profile.status - ProfileStatusEnum.submitted) * (profile.status - ProfileStatusEnum.kleros_deemed_valid) = 0

    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        eth_address=profile.eth_address,
        status=ProfileStatusEnum.challenged,
        notary_address=profile.notary_address,
        depositor_address=profile.depositor_address,
        creation_timestamp=profile.creation_timestamp,
        challenger_address=caller_address,
        challenge_evidence_cid=evidence_cid,
        challenge_creation_timestamp=TIMESTAMP,
        appellant_address=profile.appellant_address)
    _profiles.write(profile_id, new_profile)

    _receive_deposit(caller_address, CHALLENGE_DEPOSIT_SIZE)

    return ()
end

@external
func adjudicate{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt, is_valid : felt):
    alloc_locals
    assert_initialized()
    assert_caller_is_adjudicator()

    let (local profile) = get_profile(profile_id)

    # Can only adjudicate a profile that was challenged
    # XXX: move to a specific list of statuses from which a profile can be challenged
    assert profile.status = ProfileStatusEnum.challenged

    # XXX: maybe we should notarize the profile if it isn't already notarized.
    # could do this by implementing a _notarize() function.
    # (this would have the effect of returning the submission deposit.
    # apparently we just adjudicated that the profile was valid... so that
    # should double as notarization!)

    assert ((is_valid - 1) * is_valid) = 0  # ensure is_valid is exactly `0` or `1`
    let new_status = (is_valid * ProfileStatusEnum.adjudicator_deemed_valid) + (is_valid - 1) * (-ProfileStatusEnum.adjudicator_deemed_invalid)
    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        eth_address=profile.eth_address,
        status=new_status,
        notary_address=profile.notary_address,
        depositor_address=profile.depositor_address,
        creation_timestamp=profile.creation_timestamp,
        challenger_address=profile.challenger_address,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        challenge_creation_timestamp=profile.challenge_creation_timestamp,
        appellant_address=profile.appellant_address)
    _profiles.write(profile_id, new_profile)

    if is_valid == 0:
        # The challenger was correct: the profile was not valid

        # Swallow the submissinon deposit, if we still can
        let (does_profile_have_unreturned_deposit) = _get_does_profile_have_unreturned_deposit(
            profile)

        if does_profile_have_unreturned_deposit == 1:
            _swallow_deposit(SUBMISSION_DEPOSIT_SIZE)
            tempvar bitwise_ptr = bitwise_ptr
            tempvar range_check_ptr = range_check_ptr
            tempvar pedersen_ptr = pedersen_ptr
            tempvar syscall_ptr = syscall_ptr
        else:
            tempvar bitwise_ptr = bitwise_ptr
            tempvar range_check_ptr = range_check_ptr
            tempvar pedersen_ptr = pedersen_ptr
            tempvar syscall_ptr = syscall_ptr
        end

        # Handling these two payments separately isn't the most gas-efficient,
        # but it makes our contract logic clearer
        _return_deposit(profile.challenger_address, CHALLENGE_DEPOSIT_SIZE)
        _give_reward(profile.challenger_address, CHALLENGE_REWARD_SIZE)

        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        # The challenger was incorrect. Keep their deposit.
        _swallow_deposit(CHALLENGE_DEPOSIT_SIZE)

        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    return ()
end

#
# Profile-related accessors
#

@view
func get_num_profiles{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}() -> (res : felt):
    let (num_profiles) = _num_profiles.read()
    return (num_profiles)
end

@view
func get_profile{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(eth_address : felt) -> (res : Profile):
    let (profile) = _profiles.read(eth_address)
    assert_cid_is_not_zero(profile.cid)  # Ensure profile exists
    return (profile)
end

@view
func get_profile_id_by_eth_address{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(eth_address : felt) -> (profile_id : felt):
    let (profile_id) = _map_eth_address_to_profile_id.read(eth_address)
    assert_not_zero(profile_id)
    return (profile_id)
end

@view
func get_is_person{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(address) -> (is_person : felt):
    alloc_locals
    let (profile_id) = _map_address_to_profile_id.read(address)
    let (profile) = get_profile(profile_id)

    # Considered registered:
    # - submitted with notarization
    # - submitted with deposit, AND profile_age > $waiting_period days
    # - challenged AND challenge started more than $waiting_period days after profile was submitted (XXX: not implemented) (XXX: what happens if $waiting_period changes?)
    #   -> could do a state update on challenge, to set a flag for whether challenge occurred after initial period
    # - adjudicator_deemed_valid
    # - kleros_deemed_valid

    # Conidered unregistered:
    # Everything else

    if profile.status == ProfileStatusEnum.submitted:
        local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr
        local pedersen_ptr : HashBuiltin* = pedersen_ptr
        local range_check_ptr = range_check_ptr
        local syscall_ptr : felt* = syscall_ptr

        let (is_profile_notarized) = _get_is_profile_notarized(profile)
        if is_profile_notarized == 1:
            return (is_person=1)
        end

        let (did_profile_receive_deposit) = _get_did_profile_receive_deposit(profile)
        if did_profile_receive_deposit == 1:
            # If the deposit has been hanging out without anyone challenging
            # it for a number of days, we optimistically assume the profile is
            # valid.
            let (is_person) = is_le(
                profile.creation_timestamp + INITIAL_CHALLENGE_PERIOD, TIMESTAMP)
            return (is_person)
        end

        # profile was not notarized and isn't old enough to allow for optimistic
        # approval
        return (is_person=0)
    end

    if profile.status == ProfileStatusEnum.challenged:
        # XXX: implement me properly:
        # true or not depending on when challenge happened (within 3 days of profile creation?)
        return (is_person=0)
    end

    # TOOD: could merge these into a single `if` by using (x - y) * (x - z) == 0 trick
    if profile.status == ProfileStatusEnum.adjudicator_deemed_valid:
        return (is_person=1)
    end

    if profile.status == ProfileStatusEnum.kleros_deemed_valid:
        return (is_person=1)
    end

    return (is_person=0)
end

#
# Treasury
#

# XXX: find out if it works to use @view fns in included files
@view
func get_amount_available_for_challenge_rewards{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}() -> (res : felt):
    let (token_address) = _token_address.read()
    let (self_address) = _self_address.read()
    let (reserved_balance) = _reserved_balance.read()

    # Any funds that aren't challenge deposit reserves are for the security reward pool
    let (total_funds) = IERC20.balance_of(contract_address=token_address, user=self_address)
    return (total_funds - reserved_balance)
end

func _receive_deposit{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(from_address, amount):
    let (token_address) = _token_address.read()
    let (self_address) = _self_address.read()

    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance + amount)

    IERC20.transfer_from(
        contract_address=token_address, sender=from_address, recipient=self_address, amount=amount)

    return ()
end

func _return_deposit{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(to_address, amount):
    let (token_address) = _token_address.read()
    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance - amount)
    IERC20.transfer(contract_address=token_address, recipient=to_address, amount=amount)

    return ()
end

func _swallow_deposit{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(amount : felt):
    # Reduce reserved balance by the amount of the deposit that we're swallowing.
    # This has the effect of freeing up the tokens to be used for challenge rewards.
    let (reserved_balance) = _reserved_balance.read()
    _reserved_balance.write(reserved_balance - amount)

    return ()
end

func _give_reward{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(address, amount : felt):
    alloc_locals

    # Determine if we have funds
    let (amount_available_for_challenge_rewards) = get_amount_available_for_challenge_rewards()

    local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    local syscall_ptr : felt* = syscall_ptr

    let (has_funds_for_reward) = is_le(amount, amount_available_for_challenge_rewards)

    if has_funds_for_reward != 0:
        let (token_address) = _token_address.read()
        IERC20.transfer(contract_address=token_address, recipient=amount, amount=amount)

        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    return ()
end

#
# Guards
#

func assert_initialized{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}():
    let (is_initialized) = _is_initialized.read()
    assert is_initialized = 1
    return ()
end

func assert_caller_is_notary{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}():
    let (notary_address) = _notary_address.read()
    let (caller_address) = get_caller_address()
    assert notary_address = caller_address
    return ()
end

func assert_caller_is_adjudicator{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}():
    let (adjudicator_address) = _adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert adjudicator_address = caller_address
    return ()
end

@view
func assert_eth_address_is_unused{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(eth_address : felt):
    let (profile_id) = _map_eth_address_to_profile_id.read(eth_address)
    assert profile_id = 0
    return ()
end

@view
func assert_address_is_unused{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(address : felt):
    let (profile_id) = _map_address_to_profile_id.read(address)
    assert profile_id = 0
    return ()
end

#
# Temporary stuff for testing, stubbing missing StarkNet functionality, etc
#

@view
func __log(x : felt) -> (x : felt):
    return (x)
end

# The python testing framework doesn't support receiving structs yet (as of cairo 0.4.2)
@view
func __get_profile_cid_low{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt) -> (res : felt):
    let (profile) = get_profile(profile_id)
    return (profile.cid.low)
end
