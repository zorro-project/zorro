from starkware.crypto.signature.signature import (
    pedersen_hash, private_to_stark_key, sign)
private_key = 98234589934856435623745
public_key = private_to_stark_key(private_key)
print(f'Private key: {private_key}')
print(f'Public key: {public_key}')
