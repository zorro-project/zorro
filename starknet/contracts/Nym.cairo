%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address
from starkware.starknet.common.storage import Storage

from OpenZepplin.IERC20 import IERC20
from lib.cid import Cid, assert_cid_is_zero, assert_cid_is_not_zero

#
# Definitions
#

const CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in test.py
const CHALLENGE_REWARD_SIZE = 25  # This constant is also in test.py

struct Profile:
    member cid : Cid
    member address : felt  # starknet address
    member created_timestamp : felt
    member status : felt  # one of ProfileStatusEnum
    member challenge_evidence_cid : Cid
    member challenger_address : felt
end

# TODO: document allowable transitions
# Abusing a struct as an enum
struct ProfileStatusEnum:
    member submitted_via_notary : felt
    member challenged : felt
    member deemed_valid : felt
    member deemed_invalid : felt
    # member appealed_to_kleros : felt
    # member kleros_deemed_invalid : felt
    # member kleros_deemed_valid : felt
end

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

# TODO: in actuality, we want to maintain a list of valid notaries
@storage_var
func _notary_address() -> (res : felt):
end

@storage_var
func _adjudicator_address() -> (res : felt):
end

# Stores the address of the ERC20 token that we touch
@storage_var
func _token_address() -> (res : felt):
end

# Internal accounting: record how much of our balance is due to challenge
# deposits, so we don't accidentally give out people's deposits as rewards.
# (It should be possible for the shared security pool to be drained w/o revoking
# challengers' deposits.)
@storage_var
func _challenge_deposit_balance() -> (res : felt):
end

# Maps from user's ethereum address to profile properties
# TODO: decide what we want the key to be (using eth address right now.)
# TODO: decide if want to map into some bigger struct that includes
# other information about the profile, like whether or not it is challenged, etc
@storage_var
func _profiles(eth_address : felt) -> (res : Profile):
end

# internal index mapping from starknet address to eth address.
# necessary for `get_is_person`
@storage_var
func _eth_address_lookup(address : felt) -> (eth_address : felt):
end

#
# Functions with side effects
#

@external
func initialize{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
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
func submit_via_notary{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(
        eth_address : felt, profile_cid : Cid, address : felt, created_timestamp : felt):
    assert_initialized()
    assert_caller_is_notary()

    # There's no way to tell the difference between uninitialized memory, and
    # something that was stored to be zero.
    # Avoiding overloading the meaning of 0x0:
    assert_not_zero(eth_address)
    assert_not_zero(address)
    assert_cid_is_not_zero(profile_cid)

    assert_eth_address_is_unused(eth_address)
    assert_address_is_unused(address)

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
        created_timestamp=created_timestamp,
        status=ProfileStatusEnum.submitted_via_notary,
        challenge_evidence_cid=Cid(0, 0),
        challenger_address=0)

    _profiles.write(eth_address, profile)
    _eth_address_lookup.write(address, eth_address)

    return ()
end

@external
func challenge{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt, evidence_cid : Cid):
    alloc_locals

    let (local profile) = get_profile(eth_address)
    let (local self_address) = _self_address.read()
    let (local token_address) = _token_address.read()
    let (local challenger_address) = get_caller_address()

    # don't let people challenge a profile which was already challenged
    # XXX: should implement a specific allow list of the statuses that can be challenged.
    # namely: submitted_via_notary, submitted_via_bounty, ...
    assert_not_equal(profile.status, ProfileStatusEnum.challenged)

    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        created_timestamp=profile.created_timestamp,
        status=ProfileStatusEnum.challenged,
        challenge_evidence_cid=evidence_cid,
        challenger_address=challenger_address)
    _profiles.write(eth_address, new_profile)

    # Require the challenger to pay a deposit
    let (challenge_deposit_balance) = _challenge_deposit_balance.read()
    _challenge_deposit_balance.write(challenge_deposit_balance + CHALLENGE_DEPOSIT_SIZE)
    IERC20.transfer_from(
        contract_address=token_address,
        sender=challenger_address,
        recipient=self_address,
        amount=CHALLENGE_DEPOSIT_SIZE)

    return ()
end

@external
func adjudicate{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt, is_valid : felt):
    alloc_locals
    assert_caller_is_adjudicator()

    let (local profile) = get_profile(eth_address)

    # Can only adjudicate a profile that was challenged
    assert profile.status = ProfileStatusEnum.challenged

    # ensure is_valid is exactly `0` or `1`
    assert ((is_valid - 1) * is_valid) = 0
    let new_status = (is_valid * ProfileStatusEnum.deemed_valid) + (is_valid - 1) * (-ProfileStatusEnum.deemed_invalid)
    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        created_timestamp=profile.created_timestamp,
        status=new_status,
        challenge_evidence_cid=profile.challenge_evidence_cid,
        challenger_address=profile.challenger_address)
    _profiles.write(eth_address, new_profile)

    if is_valid == 0:
        # The challenger was correct
        let (amount_available_for_challenge_rewards) = get_amount_available_for_challenge_rewards()

        local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr
        local storage_ptr : Storage* = storage_ptr
        local pedersen_ptr : HashBuiltin* = pedersen_ptr
        local range_check_ptr = range_check_ptr
        local syscall_ptr : felt* = syscall_ptr
        let (local has_funds_for_reward) = is_le(
            CHALLENGE_REWARD_SIZE, amount_available_for_challenge_rewards)

        let (token_address) = _token_address.read()
        let reward_amount = has_funds_for_reward * CHALLENGE_REWARD_SIZE
        IERC20.transfer(
            contract_address=token_address,
            recipient=profile.challenger_address,
            amount=(CHALLENGE_DEPOSIT_SIZE + reward_amount))

        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar storage_ptr = storage_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar storage_ptr = storage_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    end

    # If the challenger won, they got their deposit back. If the challenger lost,
    # their deposit was eaten by the protocol (and de-facto added to the shared
    # security pool.) Either way, we don't need to reserve the deposit anymore.
    let (challenge_deposit_balance) = _challenge_deposit_balance.read()
    _challenge_deposit_balance.write(challenge_deposit_balance - CHALLENGE_DEPOSIT_SIZE)

    return ()
end

#
# Accessors
#

@view
func get_profile{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt) -> (res : Profile):
    let (profile) = _profiles.read(eth_address)
    assert_cid_is_not_zero(profile.cid)  # Ensure profile exists
    return (profile)
end

@view
func get_is_person{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(address) -> (is_person : felt):
    alloc_locals
    let (eth_address) = _eth_address_lookup.read(address)
    let (profile) = get_profile(eth_address)

    # Statuses conidered registered: submitted_via_notary, deemed_valid
    # Statuses considered unregistered: challenged, deemed_invalid
    let val = (profile.status - ProfileStatusEnum.submitted_via_notary) * (profile.status - ProfileStatusEnum.deemed_valid)
    if val == 0:
        return (is_person=1)
    else:
        return (is_person=0)
    end
end

@view
func get_amount_available_for_challenge_rewards{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}() -> (res : felt):
    let (token_address) = _token_address.read()
    let (self_address) = _self_address.read()
    let (challenge_deposit_balance) = _challenge_deposit_balance.read()

    # Any funds that aren't challenge deposit reserves are for the security reward pool
    let (total_funds) = IERC20.balance_of(contract_address=token_address, user=self_address)

    return (total_funds - challenge_deposit_balance)
end

#
# Guards
#

@view
func assert_initialized{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}():
    let (is_initialized) = _is_initialized.read()
    assert is_initialized = 1
    return ()
end

@view
func assert_caller_is_notary{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}():
    let (notary_address) = _notary_address.read()
    let (caller_address) = get_caller_address()
    assert notary_address = caller_address
    return ()
end

@view
func assert_caller_is_adjudicator{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}():
    let (adjudicator_address) = _adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert adjudicator_address = caller_address
    return ()
end

@view
func assert_eth_address_is_unused{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt):
    let (profile) = _profiles.read(eth_address)
    assert_cid_is_zero(profile.cid)
    return ()
end

@view
func assert_address_is_unused{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(address : felt):
    let (eth_address) = _eth_address_lookup.read(address)
    assert eth_address = 0
    return ()
end

#
# Temporary stuff for testing, etc
#

@view
func __log(x : felt) -> (x : felt):
    return (x)
end

# The python testing framework doesn't support receiving structs yet
@view
func __get_profile_cid_low{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt) -> (res : felt):
    let (profile) = get_profile(eth_address)
    return (profile.cid.low)
end
