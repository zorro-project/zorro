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
const PROVISIONAL_TIME_WINDOW = 9 * 24 * 60 * 60 # 9 days in seconds

# The amount of time the adjudicator has to act after a profile is challenged
const ADJUDICATION_TIME_WINDOW = 5 * 24 * 60 * 60 # 5 days

# The amount of time someone has to initiate an appeal after a profile is adjudicated (or not adjudicated due to timeout)
const APPEAL_TIME_WINDOW = 3 * 24 * 60 * 60 # 3 days

# the amount of time the final adjudicator has to act after a profile is appealed
# XXX: estimate this correctly: log2(num kleros jurors) * max_time_per_round
const FINAL_ADJUDICATION_TIME_WINDOW = 30 * 24 * 60 * 60 # 30 days


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
struct ProfileStatusEnum:
    member submitted : felt
    member challenged : felt

    member adjudicated : felt
    member adjudication_opportunity_expired : felt

    member appealed : felt
    member appeal_opportunity_expired : felt
 
    member finally_adjudicated : felt
    member final_arbitration_opportunity_expired : felt
end


#
# Challenge type
#

# Would rather have all these members on the Profile type, but we split it out
# to reduce L1 calldata footprint (hopefully challenges will be rare-ish)
struct Challenge:
    member challenge_timestamp : felt

    member was_confirmed_via_adjudication : felt
    member adjudication_timestamp : felt

    member appeal_timestamp : felt

    member was_confirmed_via_final_adjudication : felt
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
    let notary_address = _notary_address.read()

    let is_caller_the_notary = get_is_equal(notary_address, caller_address)
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

    return (profile_id)
end


func challenge():
    # can only challenge valid profiles, or profiles during their initial challenge period
    # rationale: otherwise, we have to handle challenges of profiles that were previously deemed *invalid*... more complexity!
end




# automatically follows the gray lines on this chart, recursively:
# https://lucid.app/lucidchart/3f5d0cad-572d-4674-9365-f9252c294868/edit?page=0_0&invitationId=inv_27689cb9-7be5-4f88-b76a-a0ef273ac183#

# TODO: check all the time math *very carefully*.
get_status(profile_id) -> (status: felt, is_confirmed: felt):
    let last_recorded_status = profile.last_recorded_status

    if last_recorded_status == ProfileStatusEnum.submitted:
        return (status=ProfileStatusEnum.submitted, is_confirmed=profile.is_notarized)
    end

    if last_recorded_status == ProfileStatusEnum.challenged:
        let time_passed = now - profile.challenge_timestamp

        # Potentially auto-advance to `not_appealed` status
        if time_passed > (ADJUDICATION_TIME_WINDOW + APPEAL_TIME_WINDOW):
            # In the absence of further adjudication, presume the challenger was correct
            return (status=ProfileStatusEnum.not_appealed, is_confirmed=0)
        end

        # Potentially auto-advance to `not_adjudicated` status
        if time_passed > ADJUDICATION_TIME_WINDOW:
            # In the absence of further adjudication, presume the challenger was correct
            return (status=ProfileStatusEnum.not_adjudicated, is_confirmed=0)
        end

        # We presume innocent anyone who was challenged after the initial challenge window, in order to prevent griefing.
        let is_presumed_innocent = (profile.challenge_timestamp - profile.submitted_timestamp) > PROVISIONAL_TIME_WINDOW
        return (ProfileStatusEnum.challenged, is_confirmed=is_presumed_innocent)
    end

    if last_recorded_status == ProfileStatusEnum.adjudicated:
        let time_passed = now - profile.adjudication_timestamp

        # Potentially auto-advance to `not_appealed` status
        if time_passed > APPEAL_TIME_WINDOW:
            # XXX: this would make it necessary to zero out previous adjudication decision in event of a rechallenge! otherwise adjudication confirm from prev challenge could stick around
            return (status=ProfileStatusEnum.not_appealed, is_confirmed=profile.was_confirmed_via_adjudication)
        end

        return (status=ProfileStatusEnum.adjudicated, is_confirmed=profile.was_confirmed_via_adjudication)
    end

    if last_recorded_status == ProfileStatusEnum.appealed:
        let time_passed = now - profile.appeal_timestamp

        # Potentially auto-advance to `not_finally_adjudicated`
        if time_passed > FINAL_ADJUDICATION_TIME_WINDOW:
            # There's now a serious disagreement about whether or not someone is confirmed... let's start to play it safe by assuming not.
            # XXX: Is this the right call, or should we use `is_presumed_innnocent` here to prevent griefing still?
            return (status=ProfileStatusEnum.not_finally_adjudicated, is_confirmed=0)
        end

        # XXX: how do we want to treat is_confirmed here?
        return (status=ProfileStatusEnum.appealed, is_confirmed=0)
    end

    if last_explicit_status == ProfileStatusEnum.finally_adjudicated:
        return (status=ProfileStatusEnum.finally_adjudicated, is_confirmed=profile.was_confirmed_via_final_adjudication)
    end
end
