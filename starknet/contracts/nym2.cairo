%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address

from OpenZepplin.IERC20 import IERC20

from types.cid import Cid

#
# Constants
#

const SUBMISSION_DEPOSIT_SIZE = 25
const CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in test.py

# Profiles challenged while still provision are presumed to be invalid; those challenged after are presumed valid
const PROVISIONAL_TIME_WINDOW = 9 * 24 * 60 * 60 # 9 days

# The amount of time the adjudicator has to act after a profile is challenged
const ADJUDICATION_TIME_WINDOW = 6 * 24 * 60 * 60 # 6 days

# The amount of time someone has to initiate an appeal after a profile is adjudicated (or not adjudicated due to timeout)
const APPEAL_TIME_WINDOW = 3 * 24 * 60 * 60 # 3 days

# the amount of time the super adjudicator has to act after a profile is appealed
# XXX: estimate this correctly: log2(num kleros jurors) * max_time_per_round
# Alternatively, we could send an L1->L2 message each appeal round, which would extend the window
const SUPER_ADJUDICATION_TIME_WINDOW = 30 * 24 * 60 * 60 # 30 days


#
# Storage vars
#

# Temporary: will be replaced by syscall or clock contract
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
func _super_adjudicator_address() -> (res : felt):
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

@storage_var
func _profiles(profile_id : felt) -> (res : Profile):
end

@storage_var
func _challenges(profile_id : felt) -> (res : Challenge):
end

# Map from starknet address to `profile_id`
@storage_var
func _map_address_to_profile_id(address : felt) -> (profile_id : felt):
end

#
# Profile type
#

# If you add a member to `Profile`, remember to update all Profile constructor calls
struct Profile:
    member cid : Cid
    member address : felt # starknet address
    member submitter_address : felt
    member submission_timestamp : felt
    member is_notarized : felt
    member last_recorded_status : felt  # one of ProfileStatusEnum
end

# Abusing a struct as an enum
struct ProfileEventEnum:
    member submitted : felt
    member challenged : felt
    member adjudicated : felt
    member appealed : felt
    member super_adjudicated : felt
end

# Abusing a struct as an enum
struct ProfileStatusEnum:
    member submitted : felt
    member challenged : felt

    member adjudicated : felt
    member adjudication_opportunity_expired : felt

    member appealed : felt
    member appeal_opportunity_expired : felt
 
    member super_adjudicated : felt
    member super_adjudication_opportunity_expired : felt
end

func get_is_profile_provisional(profile) -> (res:felt):
    return (profile.challenge_timestamp - profile.submitted_timestamp) > PROVISIONAL_TIME_WINDOW
end


#
# Challenge type
#

# We'd rather have all these members on the Profile type, but we split them out
# to reduce L1 calldata footprint.
# APPEND-ONLY, FELT-ONLY: The indices of this struct are used as keys of a storage var.
# They should therefore each be sized 1 felt, and not reordered.
struct Challenge:
    member challenger_address : felt
    member challenge_evidence_cid_low : felt
    member challenge_evidence_cid_high : felt
    member challenge_timestamp : felt
    member has_undistributed_rewards : felt # 0 or 1

    member profile_owner_evidence_cid_low : felt
    member profile_owner_evidence_cid_high : felt
    member adjudicator_evidence_cid_low : felt
    member adjudicator_evidence_cid_high : felt

    member did_adjudicator_deem_profile_valid : felt
    member adjudication_timestamp : felt

    member appeal_timestamp : felt

    member did_super_adjudicator_deem_profile_valid : felt
end


#
# External functions
#

@constructor
func constructor{bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(admin_address, notary_address : felt, adjudicator_address : felt, token_address : felt):

    _admin_address.write(admin_address)
    _notary_address.write(notary_address)
    _adjudicator_address.write(adjudicator_address)
    _token_address.write(token_address)
end


@external
func submit{bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_cid : Cid, address : felt) -> (profile_id : felt):
    assert_cid_is_not_zero(profile_cid)
    assert_not_zero(address)
    assert_address_is_unused(address)

    let (caller_address) = get_caller_address()
    let now = _timestamp.read()

    let is_caller_notary = get_is_caller_notary()
    _receive_deposit(caller_address, SUBMISSION_DEPOSIT_SIZE)

    let (num_profiles) = _num_profiles.read()
    let profile_id = num_profiles + 1
    _num_profiles.write(profile_id)

    let profile = Profile(
        cid=profile_cid,
        address=address,
        submitter_address=caller_address,
        submission_timestamp=now,
        is_notarized=is_caller_the_notary,
        last_recorded_status=ProfileStatusEnum.submitted,
    )

    _profiles.write(profile_id, profile)
    _map_address_to_profile_id.write(address, profile_id)

    return (profile_id=profile_id)
end

# Notarizes a profile that wasn't submitted by a notary to begin with
@external
func notarize{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*
}(profile_id : felt):
    assert_caller_is_notary()
    let (profile : Profile) = get_profile(profile_id)

    # Only profiles in the submitted state can be notarized
    assert profile.last_recorded_status = ProfileStatusEnum.submitted

    # Only profiles that are not already notarized can be notarized
    assert profile.is_notarized = 0

    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=1,
        last_recorded_status=profile.last_recorded_status
    )
    _profiles.write(profile_id, new_profile)

    return ()
end


func challenge{        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt, evidence_cid : Cid):
    let (caller_address) = get_caller_address()
    let (now) = _timestamp.read()

    let (profile) = get_profile(profile_id)

    let (profile_status, is_profile_confirmed) = get_profile_status(profile)
    let (is_profile_provisional) = get_is_profile_provisional(profile)

    # A profile can be challegned iff its status is one of the following
    # See: https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#
    assert (profile_status - ProfileStatusEnum.submitted) *
        (profile_status - ProfileStatusEnum.appeal_opportunity_expired) *
        (profile_status - ProfileStatusEnum.super_adjudicated) *
        (profile_status - ProfileStatusEnum.super_adjudication_opportunity_expired) = 0
    
    # Only allow challenging of profiles that are confirmed or are still provisional
    # (In particular, don't allow challenging of profiles that are already invalid.)
    assert (is_profile_confirmed - 1) * (is_profile_provisional - 1) = 0

    # If this profile was challenged in the past, it could still have undistributed rewards.
    # Distribute those before proceeding with a new challenge.
    maybe_distribute_challenge_rewards(profile_id)

    _receive_deposit(caller_address, CHALLENGE_DEPOSIT_SIZE)

    _challenges.write(profile_id, Challenge.challenger_address, caller_address)
    _challenges.write(profile_id, Challenge.challenge_evidence_cid_low, evidence_cid.low)
    _challenges.write(profile_id, Challenge.challenge_evidence_cid_high, evidence_cid.high)
    _challenges.write(profile_id, Challenge.challenge_timestamp, now)
    _challenges.write(profile_id, Challenge.has_undistributed_rewards, 1)

    return ()
end

func submit_evidence():
    # Look up profile by address
    # Ensure in a status where can submit evidence
end

func adjudicate():
end

# L1 -> L2 message
func appeal(appellant_addrsess : felt):
    # 
    # todo: confirm identity of caller
end

# L1 -> L2 message
func super_adjudicate():
    # todo: confirm identity of caller 
end

# takes an array of profile_ids
func maybe_distribute_challenge_rewards():
end


# automatically follows the gray lines on this chart, recursively:
# https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#

func get_profile_status(profile_id) -> (status: felt, is_confirmed: felt):
    let last_recorded_status = profile.last_recorded_status

    if last_recorded_status == ProfileStatusEnum.submitted:
        let (status, is_confirmed) = get_profile_status__submitted(profile_id, profile)
        return (status, is_confirmed)
    end

    if last_recorded_status == ProfileStatusEnum.challenged:
        let (status, is_confirmed) = get_profile_status__challenged(profile_id, profile)
        return (status, is_confirmed)
    end

    if last_recorded_status == ProfileStatusEnum.adjudicated:
        let (status, is_confirmed) = get_profile_status__adjudicated(profile_id, profile)
        return (status, is_confirmed)
    end

    if last_recorded_status == ProfileStatusEnum.appealed:
        let (status, is_confirmed) = get_profile_status__appealed(profile_id, profile)
        return (status, is_confirmed)
    end

    if last_explicit_status == ProfileStatusEnum.super_adjudicated:
        let (status, is_confirmed) = get_profile_status__super_adjudicated(profile_id, profile)
        return (status, is_confirmed)
    end
end


# XXX: check time math / logic of get_profile_status_* very carefully
func get_profile_status__submitted(profile_id : felt, profile : Profile) -> (status : felt, is_confirmed : felt):
    return (status=ProfileStatusEnum.submitted, is_confirmed=profile.is_notarized)
end

func get_profile_status__challenged(profile_id : felt, profile : Profile):
    let time_passed = now - profile.challenge_timestamp

    # Potentially auto-advance to the `appeal_opportunity_expired` status
    if time_passed > (ADJUDICATION_TIME_WINDOW + APPEAL_TIME_WINDOW):
        # In the absence of further adjudication, presume the challenger was correct
        return (status=ProfileStatusEnum.appeal_opportunity_expired, is_confirmed=0)
    end

    # Potentially auto-advance to the `adjudication_opportunity_expired` status
    if time_passed > ADJUDICATION_TIME_WINDOW:
        # In the absence of further adjudication, presume the challenger was correct
        return (status=ProfileStatusEnum.adjudication_opportunity_expired, is_confirmed=0)
    end

    # We presume innocent anyone who was challenged after the initial challenge window, in order to prevent griefing.
    let is_provisional = get_is_profile_provisional(profile)
    let is_confirmed = not(is_provisional)
    return (ProfileStatusEnum.challenged, is_confirmed)
end

func get_profile_status__adjudicated(profile_id : felt, profile : Profile):
    let time_passed = now - profile.adjudication_timestamp

    # Potentially auto-advance to the `appeal_opportunity_expired` status
    if time_passed > APPEAL_TIME_WINDOW:
        # XXX: this would make it necessary to zero out previous adjudication decision in event of a rechallenge! otherwise adjudication confirm from prev challenge could stick around
        return (status=ProfileStatusEnum.appeal_opportunity_expired, is_confirmed=profile.was_confirmed_via_adjudication)
    end

    return (status=ProfileStatusEnum.adjudicated, is_confirmed=profile.was_confirmed_via_adjudication)
end

func get_profile_status__appealed(profile_id : felt, profile : Profile):
    let time_passed = now - profile.appeal_timestamp

    # Potentially auto-advance to the `super_adjudication_opportunity_expired` status
    if time_passed > SUPER_ADJUDICATION_TIME_WINDOW:
        # There's now a serious disagreement about whether or not someone is confirmed... let's start to play it safe by assuming not.
        # XXX: Is this the right call, or should we use `is_presumed_innnocent` here to prevent griefing still?
        return (status=ProfileStatusEnum.super_adjudication_opportunity_expired, is_confirmed=0)
    end

    # XXX: how do we want to treat is_confirmed here?
    return (status=ProfileStatusEnum.appealed, is_confirmed=0)
end

func get_profile_status__super_adjudicated(profile_id : felt profile : Profile):
    return (status=ProfileStatusEnum.super_adjudicated, is_confirmed=profile.was_confirmed_via_super_adjudication)
end




#
# Treasury
#

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

#
# Roles and guards
#

func get_is_caller_notary{ bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr, syscall_ptr : felt*}() -> (res: felt):
    let (caller_address) = get_caller_address()
    let notary_address = _notary_address.read()
    let is_notary = get_is_equal(notary_address, caller_address)
    return (res=is_notary)
end

func assert_is_caller_notary():
    let is_notary = get_is_caller_notary()
    assert is_notary = 1
    return ()
end

func assert_caller_is_adjudicator{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}():
    let (adjudicator_address) = _adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert caller_address = adjudicator_address
    return ()
end

func assert_caller_is_super_adjudicator{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}():
    let (adjudicator_address) = _super_adjudicator_address.read()
    let (caller_address) = get_caller_address()
    assert caller_address = super_adjudicator_address
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
