%lang starknet
%builtins pedersen range_check bitwise

from starkware.cairo.common.math import assert_not_zero, assert_not_equal
from starkware.cairo.common.math_cmp import is_le
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address

from OpenZepplin.IERC20 import IERC20

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

struct Profile:
    member digest : felt # cidv1 multihash `<hash function output>` for profile pic/video/etc
    member address : felt # starknet address
    member submitter_address : felt
    member submission_timestamp : felt
    member is_notarized : felt
    #member last_challenge_event : felt # one of ChallengeEventEnum
    #member last_challenge_event_timestamp : felt
end


# XXX: this is mis-implemented
func get_is_profile_provisional(profile) -> (res: felt):
    return (now - profile.submission_timestamp) < PROVISIONAL_TIME_WINDOW
end

#
# Challenge types
#

# Abusing a struct as an enum
struct ChallengeStorageEnum:
    member last_event : felt # one of ChallengeEventEnum

    # Set in same tx that shifts `last_event` to `challenged`:
    member challenge_timestamp : felt # nonzero iff there was a challenge
    member challenger_address : felt
    member challenge_evidence_digest : felt

    # Optionally set while `last_event` is `challenged`:
    member profile_owner_evidence_digest : felt

    # Set in same tx that shifts `last_event` to `adjudicated`:
    member adjudication_timestamp : felt # nonzero iff there was an adjudication
    member adjudicator_evidence_digest : felt
    member did_adjudicator_confirm_profile : felt

    # Set in the same tx that shifts `last_event` to `appealed`
    member appeal_timestamp : felt # nonzero iff there was an appeal

    # Set in same tx that shifts `last_event` to `super_adjudicated`:
    member super_adjudication_timestamp : felt # nonzero iff there was a super adjudication
    member did_super_adjudicator_confirm_profile : felt
end

# Abusing a struct as an enum
struct ChallengeEventEnum:
    member not_challenged : felt # intentionally has an index of `0` (unset memory); thus challenge storage that has never been set will denote not_challenged
    member challenged : felt
    member adjudicated : felt
    member appealed : felt
    member super_adjudicated : felt
    member settled : felt
end


# Abusing a struct as an enum
# ChallengeStatusEnum includes states that can be reached purely by the passage of time.
# challenge_status = f(challenge_event, challenge_event_timestamp, now)
struct ChallengeStatusEnum:
    member not_challenged : felt
    member challenged : felt
    member adjudicated : felt
    member adjudication_opportunity_expired : felt
    member appealed : felt
    member appeal_opportunity_expired : felt
    member super_adjudicated : felt
    member super_adjudication_opportunity_expired : felt
    member settled : felt # rewards/deposits/etc have been disbursed
end

func _get_did_adjudication_occur():
    let (adjudication_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.adjudication_timestamp)
    if adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_appeal_occur():
    let (timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.appeal_timestamp)
    if appeal_timestamp == 0:
        return (0)
    end
    return (1)
end

func _get_did_super_adjudication_occur():
    let (super_adjudication_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.super_adjudication_timestamp)
    if super_adjudication_timestamp == 0:
        return (0)
    end
    return (1)
end

func _reset_challenge(profile_id : felt):
    return _inner_reset_challenge(profile_id, 0)
end

func _inner_reset_challenge(profile_id : felt, i : felt):
    if i == ChallengeStorageEnum.SIZE:
        return ()
    end
    _challenges.write(profile_id, i, 0)
    return _inner_reset_challenge(profile_id, i + 1)
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
        syscall_ptr : felt*}(digest : felt, address : felt) -> (profile_id : felt):
    assert_not_zero(profile_digest)
    assert_not_zero(address)
    assert_is_unused_address(address)

    let (caller_address) = get_caller_address()
    let now = _timestamp.read()

    let is_caller_notary = get_is_caller_notary()
    _receive_deposit(caller_address, SUBMISSION_DEPOSIT_SIZE)

    let (num_profiles) = _num_profiles.read()
    let profile_id = num_profiles + 1
    _num_profiles.write(profile_id)

    let profile = Profile(
        digest=digest,
        address=address,
        submitter_address=caller_address,
        submission_timestamp=now,
        is_notarized=is_caller_the_notary,
        #last_challenge_event=ChallengeEventEnum.awaiting_challenge,
    )

    _profiles.write(profile_id, profile)
    _map_address_to_profile_id.write(address, profile_id)

    return (profile_id=profile_id)
end


# Notarizes a profile that wasn't submitted by a notary to begin with
@external
func notarize{
        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt* }(profile_id : felt):
    
    # Only notaries can notarize
    assert_caller_is_notary()

    # only notarize profiles that exist
    assert_profile_exists(profile_id)

    # Only notarize profiles that aren't already notarized
    let (profile : Profile) = get_profile(profile_id)
    assert profile.is_notarized = 0

    # Only notarize profiles that aren't challenged
    let (challenge_status : felt) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.not_challenged

    let new_profile = Profile(
        cid=profile.cid,
        address=profile.address,
        submitter_address=profile.submitter_address,
        submission_timestamp=profile.submission_timestamp,
        is_notarized=1,
        #last_challenge_event=profile.last_challenge_event
    )
    _profiles.write(profile_id, new_profile)

    return ()
end


func challenge{        bitwise_ptr : BitwiseBuiltin*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        syscall_ptr : felt*}(profile_id : felt, evidence_digest : felt):

    # Only challenge profiles that exist
    assert_profile_exists(profile_id)

    # Make way for this challenge by settling any existing challenge (if there is one, and if it can be settled)
    maybe_settle(profile_id)

    let (caller_address) = get_caller_address()
    let (now) = _timestamp.read()
    let (status) = get_challenge_status(profile_id)

    # Only challenge prpfiles that are `not_challenged` or `settled`
    # See: https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#
    assert (status - ChallengeStatusEnum.not_challenged) * (status - ChallengeStatusEnum.settled) = 0

    # Only allow challenging of profiles that are confirmed or are still provisional
    # (In particular, don't allow challenging of profiles that are already invalid.)
    let (is_profile_confirmed) = get_is_profile_confirmed(profile_id)
    let (is_profile_provisional) = get_is_profile_provisional(profile)
    assert (is_profile_confirmed - 1) * (is_profile_provisional - 1) = 0

    _receive_deposit(caller_address, CHALLENGE_DEPOSIT_SIZE)

    # If this profile was previously challenged, then clear out the old challenge information
    if status = ChallengeStorageEnum.settled:
        _reset_challenge(profile_id)
    end

    _challenges.write(profile_id, ChallengeStorageEnum.last_event, ChallengeEventEnum.challenged)
    _challenges.write(profile_id, ChallengeStorageEnum.challenger_address, caller_address)
    _challenges.write(profile_id, ChallengeStorageEnum.challenge_evidence_digest, evidence_digest)
    _challenges.write(profile_id, ChallengeStorageEnum.challenge_timestamp, now)

    return ()
end


# Allows a profile owner to directly submit evidence on their own behalf
# Useful if the profile owner thinks that the adjudicator won't do a good job of defending their profile
# XXX: document limitation — there's nothing to prevent the adjudicator from adjudicating immediately to prevent evidence from being submitted by the profile owner. Maybe for now the appeal MetaEvidence policy can help handle this abusive case.
func submit_evidence{}(profile_id : felt, evidence_digest : felt):
    let profile_id = _get_caller_profile_id()
    let (challenge_status) = get_challenge_status(profile_id)

    # Can only submit evidence while challenge status is `challenged` (i.e. before adjudication)
    assert challenge_status = ChallengeStatusEnum.challenged

    _challenges.write(profile_id, ChallengeStorageEnum.profile_owner_evidence_digest, evidence_digest)
    return ()
end


func adjudicate{}(profile_id : felt, evidence_digest : felt, should_confirm_profile : felt):
    assert_caller_is_adjudicator()
    assert_profile_exists(profile_id)
    assert_is_boolean(should_confirm_profile)

    # Only adjudicate things that are `challenged`
    let (challenge_status) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.challenged

    let (now) = _timestamp.read()
    _challenges.write(profile_id, ChallengeStorageEnum.last_event, ChallengeEventEnum.adjudicated)
    _challenges.write(profile_id, ChallengeStorageEnum.adjudication_timestamp, now)
    _challenges.write(profile_id, ChallengeStorageEnum.adjudicator_evidence_digest, evidence_digest)
    _challenges.write(profile_id, ChallengeStorageEnum.did_adjudicator_confirm_profile, should_confirm_profile)

    return ()
end


@l1_handler
func appeal(from_address : felt):
    let (super_adjudicator_address) = _super_adjudicator_address.read()
    assert from_address = super_adjudicator_address

    # Only appeal things that are `adjudicated` or `adjudication_opportunity_expired`
    let (challenge_status) = get_challenge_status(profile_id)
    assert (challenge_status - ChallengeStatusEnum.adjudicated) * (challenge_status - ChallengeStatusEnum.adjudication_opportunity_expired) = 0

    let (now) = _timestamp.read()
    _challenges.write(profile_id, ChallengeStorageEnum.last_event, ChallengeEventEnum.appealed)
    _challenges.write(profile_id, ChallengeStorageEnum.appeal_timestamp, now)

    return ()
end


@l1_handler
func super_adjudicate(from_address : felt, should_confirm_profile : felt):
    let (super_adjudicator_address) = _super_adjudicator_address.read()
    assert from_address = super_adjudicator_address

    assert_is_boolean(should_confirm_profile)

    # Only super adjudicate things that are `appealed`
    let (challenge_status) = get_challenge_status(profile_id)
    assert challenge_status = ChallengeStatusEnum.appealed

    _challenges.write(profile_id, ChallengeStorageEnum.last_event, ChallengeEventEnum.super_adjudicated)
    _challenges.write(profile_id, ChallengeStorageEnum.super_adjudication_timestamp, now)
    _challenges.write(profile_id, ChallengeStorageEnum.did_super_adjudicator_confirm_profile, should_confirm_profile)

    return ()
end

@external
func maybe_settle(profile_id : felt):
    # A profile can be challegned iff its status is one of the following
    # See: https://lucid.app/lucidchart/df9f25d3-d9b0-4d0a-99d1-b1eac42eff3b/edit?from_docslist=true
    let res = (status - ChallengeStatusEnum.appeal_opportunity_expired) *
        (status - ChallengeStatusEnum.super_adjudicated) *
        (status - ChallengeStatusEnum.super_adjudication_opportunity_expired)

    if res = 0:
        # Learn the final outcome of the challenge
        let (is_profile_confirmed) = get_is_profile_confirmed(profile_id)

        if is_profile_confirmed == 1:
            # The challenger was wrong: take their deposit
            _swallow_deposit(CHALLENGE_DEPOSIT_SIZE)
        else:
            # The challenger was right: return their deposit and pay them!
            _return_deposit(profile.challenger_address, CHALLENGE_DEPOSIT_SIZE)
            _give_reward(profile.challenger_address, CHALLENGE_REWARD_SIZE)
        end

        _challenges.write(profile_id, ChallengeStorageEnum.last_event, ChallengeEventEnum.settled)
    end

    return ()
end

#
# Profile/challenge status accessors
#

# automatically follows the gray lines on this chart, recursively:
# https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#
func get_challenge_status(profile_id,  now) -> (status: felt):
    let (last_challenge_event) = _challenges.read(profile_id, ChallengeStorageEnum.last_event)

    #
    # Not challenged
    #

    if last_challenge_event == ChallengeEventEnum.not_challenged:
        return (ChallengeStatusEnum.not_challenged)
    end

    #
    # Challenged
    #

    if last_challenge_event == ChallengeEventEnum.challenged:
        let (challenge_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.challenge_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - challenge_timestamp

        # Potentially auto-advance all the way to `appeal_opportunity_expired`
        if time_passed > (ADJUDICATION_TIME_WINDOW + APPEAL_TIME_WINDOW):
            return (ChallengeStatusEnum.appeal_opportunity_expired)
        end

        # Potentially auto-advance to `adjudication_opportunity_expired`
        if time_passed > ADJUDICATION_TIME_WINDOW:
            return (ChallengeStatusEnum.adjudication_opportunity_expired)
        end

        return (ChallengeStatusEnum.challenged)
    end

    #
    # Adjudicated
    #

    if last_challenge_event == ChallengeEventEnum.adjudicated:
        let (adjudication_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.adjudication_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - adjudication_timestamp

        # Potentially auto-advance to `appeal_opportunity_expired`
        if time_passed > APPEAL_TIME_WINDOW:
            return (ChallengeStatusEnum.appeal_opportunity_expired)
        end

        return (ChallengeStatusEnum.adjudicated)
    end

    #
    # Appealed
    #

    if last_challenge_event == ChallengeEventEnum.appealed:
        let (appeal_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.appeal_timestamp)
        let (now) = _timestamp.read()
        let time_passed = now - appeal_timestamp

        # Potentially auto-advance to `super_adjudication_opportunity_expired`
        if time_passed > SUPER_ADJUDICATION_TIME_WINDOW:
            return (ChallengeStatusEnum.super_adjudication_opportunity_expired)
        end

        return (ChallengeStatusEnum.appealed)
    end

    #
    # Super adjudicated
    #

    if last_challenge_event == ChallengeEventEnum.super_adjudicated:
        return (ChallengeStatusEnum.super_adjudicated)
    end

    #
    # Settled
    #

    if last_challenge_event == ChallengeEventEnum.settled:
        return (ChallengeStatusEnum.settled)
    end
end


@external
func get_is_profile_confirmed(profile_id):
    let (challenge_status) = get_challenge_status(profile_id)

    #
    # {not_challenged}
    #

    if challenge_status == ChallengeStatusEnum.not_challenged:
        # confirmed if notarized OR survived provisional period without being challenged
        let (profile) = get_profile(profile_id)
        let (is_provisional) = get_is_profile_provisional(profile)

        # is_notarized || !is_provisional
        if (profile.is_notarized - 1) * is_provisional == 0:
            return (1)
        else:
            return (0)
        end
    end

    #
    # All other statuses, e.g. {challenged, adjudicated, ...}
    #

    # Logic:
    # 1. A super adjudiciation is determinative
    # 2. Absent that, adjudication is determinative
    # 3. Absent that, presume innocence or not depending on whether the profile was still provisional when it was challenged

    let (did_super_adjudication_occur) = _get_did_super_adjudication_occur(profile_id)
    if did_super_adjudication_occur == 1:
        return _challenges.read(profile_id, ChallengeStorageEnum.did_super_adjudicator_confirm_profile)
    end

    let (did_adjudication_occur) = _get_did_adjudication_occur(profile_id)
    if did_adjudication_occur == 1:
        return _challenges.read(profile_id, ChallengeStorageEnum.did_adjudicator_confirm_profile)
    end

    let (challenge_timestamp) = _challenges.read(profile_id, ChallengeStorageEnum.challenge_timestamp)
    let is_presumed_innocent = (challenge_timestamp - profile.submission_timestamp) > PROVISIONAL_TIME_WINDOW

    # XXX: consider a case where the adjudicator and the super adjudicator both time out...
    # Super edge case, but maybe we should side with the challenger in that case?

    return (is_presumed_innocent)
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

func _get_caller_profile_id{}() -> (profile_id : felt):
    let (caller_address) = get_caller_address()
    let (profile_id) = _map_address_to_profile_id.read(caller_address)
    assert_not_zero(profile_id)
    return (profile_id)
end


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

@view
func assert_profile_exists{}(profile_id):
    # XXX stub
end

func assert_is_boolean{}(x : felt):
    # x == 0 || x == 1
    assert ((x - 1) * x) = 0
end