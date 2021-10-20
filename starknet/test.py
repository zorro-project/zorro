import asyncio
import pytest
import os
from types import SimpleNamespace

from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode
from starkware.starknet.testing.starknet import Starknet
from starkware.crypto.signature.signature import (
    pedersen_hash,
    private_to_stark_key,
    sign,
)

from OpenZepplin.Signer import Signer

# TODOS:
# - write a test where a non-notary tries to call apply_via_notary

notary = Signer(12345)
other = Signer(234852304958)

applicant_eth_address = 0x1234
profile = 1234


@pytest.fixture(scope="module")
def event_loop():
    return asyncio.new_event_loop()


def get_contract_path(path):
    return os.path.join(os.path.dirname(__file__), path)


@pytest.fixture(scope="module")
async def ctx():
    starknet = await Starknet.empty()

    # Create and initialize account contract
    notary_account = await starknet.deploy(
        get_contract_path("OpenZepplin/Account.cairo")
    )
    await notary_account.initialize(
        notary.public_key, notary_account.contract_address, 0
    ).invoke()

    # Create and initialize nym
    nym = await starknet.deploy(get_contract_path("nym.cairo"))
    await nym.initialize(notary_address=notary_account.contract_address).invoke()
    return SimpleNamespace(starknet=starknet, notary_account=notary_account, nym=nym)


@pytest.mark.asyncio
async def test_apply_via_notary(ctx):

    """
    private_key = 1
    user = generate_public_key(private_key)
    (message_hash, (sig_r, sig_s)) = sign_message(private_key, profile)
    """

    async def apply_via_notary():
        await notary.send_transaction(
            ctx.notary_account,
            ctx.nym.contract_address,
            "apply_via_notary",
            [applicant_eth_address, profile],
        )

    await apply_via_notary()

    # ensure result is in contract storage
    assert await ctx.nym.get_profile(eth_address=applicant_eth_address).call() == (
        profile,
    )

    # applying a second time should result in an error, because the
    # profile already exists
    with pytest.raises(StarkException) as e_info:
        await apply_via_notary()
    # XXX: it would be nice if we could explicitly check that an assert failed
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED


@pytest.mark.asyncio
async def test_apply_via_notary(ctx):
    print("test result", await ctx.nym.test().call())


"""
def generate_public_key(private_key):
    public_key = private_to_stark_key(private_key)
    print(f"Public key: {public_key}")
    return public_key


def sign_message(private_key, message):
    message_hash = pedersen_hash(message)
    return (message_hash, sign(msg_hash=message_hash, priv_key=private_key))

@pytest.mark.asyncio
async def test_apply():
    starknet = await Starknet.empty()
    contract = await starknet.deploy(get_contract_path("nym.cairo"))

    private_key = 1
    user = generate_public_key(private_key)
    profile = 1234
    (message_hash, (sig_r, sig_s)) = sign_message(private_key, profile)

    async def apply():
        await contract.apply(
            user=user,
            profile=profile,
            message_hash=message_hash,
            sig_r=sig_r,
            sig_s=sig_s,
        ).invoke()

    await apply()

    # ensure result is in contract storage
    assert await contract.get_profile(user=user).call() == (profile,)

    # applying a second time should result in an error, because the
    # profile already exists
    with pytest.raises(StarkException) as e_info:
        await apply()
    # XXX: it would be nice if we could explicitly check that an assert failed
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED
"""
