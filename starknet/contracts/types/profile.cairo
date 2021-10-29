%lang starknet

from starkware.cairo.common.math_cmp import is_not_zero

from types.cid import Cid

# If you add a member to `Profile`, remember to update all Profile constructor calls
struct Profile:
    member cid : Cid
    member address : felt  # starknet address
    member eth_address : felt
    member status : felt  # one of ProfileStatusEnum

    # Invariant: at least one of notary_address and depositor_address are nonzero
    member notary_address : felt  # address of notary (0 if not notarized)
    member depositor_address : felt  # address that funded deposit (0 if no deposit)

    member creation_timestamp : felt

    member challenger_address : felt
    member challenge_evidence_cid : Cid
    member challenge_creation_timestamp : felt

    member appellant_address : felt  # address of person who appealed (0 if no appeal)
end

# Abusing a struct as an enum
struct ProfileStatusEnum:
    member submitted : felt
    member challenged : felt
    member adjudicator_deemed_valid : felt
    member adjudicator_deemed_invalid : felt
    member appealed_to_kleros : felt
    member kleros_deemed_valid : felt
    member kleros_deemed_invalid : felt
end

# Profile status transition chart
#

#
#                                 |
#                                 v
#                             submitted
#                                 |
#                                 v
#                            challenged <--------------------------\
#                                 |                                |
#                    ____________/ \____________                   |
#                   /                           \                  |
#                  v                             v                 |
#      adjudicator_deemed_invalid    adjudicator_deemed_valid      |
#                  |                             |                 |
#                  \_____________________________/                 |
#                                 |                                |
#                                 v                                |
#                        appealed_to_kleros                        |
#                                 |                                |
#                     ___________/ \___________                    |
#                    /                         \                   |
#                   v                           v                  |
#         kleros_deemed_invalid         kleros_deemed_valid        |
#                                               |                  |
#                                               |                  |
#                                               \------------------/
#

#
# Helpers
#

# These functions are semantically helpful. If too inefficient, can inline them

func _get_is_profile_notarized(profile : Profile) -> (res : felt):
    let (is_notarized) = is_not_zero(profile.notary_address)
    return (is_notarized)
end

func _get_did_profile_receive_deposit(profile : Profile) -> (res : felt):
    let (did_profile_receive_deposit) = is_not_zero(profile.depositor_address)
    return (did_profile_receive_deposit)
end

func _get_does_profile_have_unreturned_deposit(profile : Profile) -> (res : felt):
    let (did_profile_receive_deposit) = _get_did_profile_receive_deposit(profile)
    let (is_notarized) = _get_is_profile_notarized(profile)

    # (did_profile_receive_deposit == 1 && is_notarized == 0)
    let res = did_profile_receive_deposit - is_notarized
    return (res)
end
