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

# - convert to using structs rather than using struct enum approach (likely more gas-efficient)
# - add a get_profile method
# - add a get_highest_profile_id method
# - switch to autoincrement ids

# Bonus TODOS
# - self approval via bounty
# - serial challenges
# - appeal adjudication decisions to kleros
# - privacy via nyms
# - support a list of notaries, adding/removing notaries
# - multisig (hoping someone else does this for us)

# Necessary before any launch
# - much more extensive tests

# Whoever gets to it:
# - write js bindings

# Things to consider:
# - rechallenging
#   - if no rechallenges: profiles can become impervious
#   - if rechallenges: griefing vector? someone could just keep challenging you. could increase deposit 2x each challenge)
#   - Decision: allow serial (but not parallel) rechallenges
# - whether challenge bounty can be configured. Decision: not for now
# - contract upgradeability
# - write an export function?
# - splitting contract into separate parts (e.g. could have a separate contract for managing challenges)

const CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in test.py
const CHALLENGE_REWARD_SIZE = 25  # This constant is also in test.py

# member notary_address : felt Not necessary since is part of chain history
# TODO: maybe better not to use this pattern for profiles
struct ProfilePropertyEnum:
    member cid_low : felt
    member cid_high : felt
    member address : felt  # starknet address
    member created_timestamp : felt

    member status : felt  # one of ProfileStatusEnum

    member challenge_evidence_cid_low : felt
    member challenge_evidence_cid_high : felt

    # track who the challenger is so we can pay them if they prove to be right
    member challenger_address : felt
end

# Abusing a struct as an enum
struct ProfileStatusEnum:
    member submitted_via_notary : felt
    member challenged : felt
    member deemed_valid : felt
    member deemed_invalid : felt
end

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
func _profiles(eth_address : felt, profile_property : felt) -> (res : felt):
end

# internal index mapping from starknet address to eth address.
# necessary for `get_is_person`
@storage_var
func _eth_address_lookup(address : felt) -> (eth_address : felt):
end

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
    alloc_locals
    assert_initialized()

    assert_caller_is_notary()

    # builtin assert functions lose refs
    local storage_ptr : Storage* = storage_ptr
    local pedersen_ptr : HashBuiltin* = pedersen_ptr
    local range_check_ptr = range_check_ptr
    local syscall_ptr : felt* = syscall_ptr

    # There's no way to tell the difference between uninitialized memory, and
    # something that was stored to be zero.
    # Avoiding overloading the meaning of 0x0:
    assert_not_zero(eth_address)
    assert_not_zero(address)
    assert_cid_is_not_zero(profile_cid)

    assert_profile_does_not_exist(eth_address)
    assert_address_is_unused(address)

    # XXX: The ethereum address should sign the cid, and we should verify
    # that signature here. Otherwise, someone could claim someone else's
    # eth address, which could lead to confusion. Also, they could grief
    # the owner of the eth address by submitting an invalid profile to lock
    # them out of proving their personhood with that eth address.

    _profiles.write(eth_address, ProfilePropertyEnum.cid_low, profile_cid.low)
    _profiles.write(eth_address, ProfilePropertyEnum.cid_high, profile_cid.high)
    _profiles.write(eth_address, ProfilePropertyEnum.address, address)
    _profiles.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.submitted_via_notary)

    # Starknet doesn't yet have a timestamp opcode, but according to them it's hopefully coming in a few weeks
    # For now, we can trust the notary to include it accurately, and the profile could be challenged if it is not accurate.
    _profiles.write(eth_address, ProfilePropertyEnum.created_timestamp, created_timestamp)

    _eth_address_lookup.write(address, eth_address)

    return ()
end

@external
func challenge{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt, evidence_cid : Cid):
    alloc_locals
    assert_profile_exists(eth_address)

    let (local status) = get_profile_value(eth_address, ProfilePropertyEnum.status)
    let (local self_address) = _self_address.read()
    let (local token_address) = _token_address.read()
    let (local challenger_address) = get_caller_address()

    # don't let people challenge a profile which was already challenged
    assert_not_equal(status, ProfileStatusEnum.challenged)

    _profiles.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.challenged)
    _profiles.write(eth_address, ProfilePropertyEnum.challenger_address, challenger_address)
    _profiles.write(eth_address, ProfilePropertyEnum.challenge_evidence_cid_low, evidence_cid.low)
    _profiles.write(eth_address, ProfilePropertyEnum.challenge_evidence_cid_high, evidence_cid.high)

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
    assert_profile_exists(eth_address)

    let (status : felt) = get_profile_value(eth_address, ProfilePropertyEnum.status)
    # Can only adjudicate something that was challenged
    assert status = ProfileStatusEnum.challenged

    if is_valid == 1:
        storage_ptr = storage_ptr  # TODO: get rid of this? weird line.
        _profiles.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.deemed_valid)

        tempvar bitwise_ptr = bitwise_ptr
        tempvar range_check_ptr = range_check_ptr
        tempvar storage_ptr = storage_ptr
        tempvar pedersen_ptr = pedersen_ptr
        tempvar syscall_ptr = syscall_ptr
    else:
        _profiles.write(eth_address, ProfilePropertyEnum.status, ProfileStatusEnum.deemed_invalid)
        let (amount_available_for_challenge_rewards) = get_amount_available_for_challenge_rewards()

        local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr
        local storage_ptr : Storage* = storage_ptr
        local pedersen_ptr : HashBuiltin* = pedersen_ptr
        local range_check_ptr = range_check_ptr
        local syscall_ptr : felt* = syscall_ptr
        let (local has_funds_for_reward) = is_le(
            CHALLENGE_REWARD_SIZE, amount_available_for_challenge_rewards)

        let (challenger_address) = get_profile_value(
            eth_address, ProfilePropertyEnum.challenger_address)
        let (token_address) = _token_address.read()
        let reward_amount = has_funds_for_reward * CHALLENGE_REWARD_SIZE
        IERC20.transfer(
            contract_address=token_address,
            recipient=challenger_address,
            amount=(CHALLENGE_DEPOSIT_SIZE + reward_amount))

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

@view
func get_profile_value{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt, index : felt) -> (res : felt):
    let (res) = _profiles.read(eth_address, index)
    return (res)
end

@view
func get_is_person{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(address) -> (is_person : felt):
    alloc_locals
    let (local eth_address) = _eth_address_lookup.read(address)
    let (local status) = get_profile_value(eth_address, ProfilePropertyEnum.status)
    assert_profile_exists(eth_address)

    # Statuses conidered registered: submitted_via_notary, deemed_valid
    # Statuses considered unregistered: challenged, deemed_invalid
    let val = (status - ProfileStatusEnum.submitted_via_notary) * (status - ProfileStatusEnum.deemed_valid)
    if val == 0:
        return (is_person=1)
    else:
        return (is_person=0)
    end
end

# Guards

@view
func assert_initialized{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}():
    let (is_initialized) = _is_initialized.read()
    assert is_initialized = 1
    return ()
end

@view
func assert_profile_exists{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt):
    alloc_locals
    let (cid_low) = _profiles.read(eth_address, ProfilePropertyEnum.cid_low)
    let (cid_high) = _profiles.read(eth_address, ProfilePropertyEnum.cid_high)
    local cid : Cid = Cid(cid_low, cid_high)

    assert_cid_is_not_zero(cid)
    return ()
end

@view
func assert_profile_does_not_exist{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(eth_address : felt):
    alloc_locals
    let (cid_low) = _profiles.read(eth_address, ProfilePropertyEnum.cid_low)
    let (cid_high) = _profiles.read(eth_address, ProfilePropertyEnum.cid_high)
    local cid : Cid = Cid(cid_low, cid_high)
    assert_cid_is_zero(cid)
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
func assert_address_is_unused{
        bitwise_ptr : BitwiseBuiltin*, storage_ptr : Storage*, pedersen_ptr : HashBuiltin*,
        range_check_ptr, syscall_ptr : felt*}(address : felt):
    let (eth_address) = _eth_address_lookup.read(address)
    assert eth_address = 0
    return ()
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

@view
func log(x : felt) -> (x : felt):
    return (x)
end
