%lang starknet
%builtins pedersen range_check ecdsa

from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature
from starkware.starknet.common.syscalls import get_caller_address
from starkware.starknet.common.storage import Storage

@storage_var
func is_initialized_var() -> (res : felt):
end

# TODO: in actuality, we want to maintain a list of valid notaries
@storage_var
func notary_address_var() -> (res : felt):
end

# Maps from user's ethereum address to a profile hash
# TODO: decide what we want the key to be (using eth address right now.)
# TODO: decide if want to map into some bigger struct that includes
# other information about the profile, like whether or not it is challenged, etc
@storage_var
func profiles_var(eth_address : felt) -> (res : felt):
end

@external
func initialize{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        notary_address : felt):
    let (is_initialized) = is_initialized_var.read()
    assert is_initialized = 0
    is_initialized_var.write(1)

    notary_address_var.write(notary_address)
    return ()
end

@external
func apply_via_notary{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr,
        ecdsa_ptr : SignatureBuiltin*, syscall_ptr : felt*}(
        applicant_eth_address : felt, profile : felt):
    assert_initialized()
    assert_notary()

    let (existing_profile) = profiles_var.read(eth_address=applicant_eth_address)

    # Ensure that profile hasn't already been submitted
    # XXX: handle profile updates?
    assert existing_profile = 0

    profiles_var.write(applicant_eth_address, profile)
    return ()
end

# Returns the profile of the given user.
@view
func get_profile{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}(
        eth_address : felt) -> (res : felt):
    let (res) = profiles_var.read(eth_address=eth_address)
    return (res)
end

# @external
# func approve_via_notary{}()

# let (message_hash) = hash2{hash_ptr=pedersen_ptr}(amount, 0):

# XXX: vuln to replay attaks
# verify_ecdsa_signature(
# message=message_hash,
# public_key=user,
# signature_r=sig_r,
# signature_s=sig_s)

# end

# Guards

@view
func assert_initialized{storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, range_check_ptr}():
    let (is_initialized) = is_initialized_var.read()
    assert is_initialized = 1
    return ()
end

@view
func assert_notary{
        storage_ptr : Storage*, pedersen_ptr : HashBuiltin*, syscall_ptr : felt*, range_check_ptr}(
        ):
    let (notary_address) = notary_address_var.read()
    let (caller_address) = get_caller_address()
    assert notary_address = caller_address
    return ()
end
