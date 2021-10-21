import asyncio
import pytest
import os
from types import SimpleNamespace
import time

from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode
from starkware.starknet.testing.starknet import Starknet
from starkware.crypto.signature.signature import (
    pedersen_hash,
    private_to_stark_key,
    sign,
)

from OpenZepplin.Signer import Signer

adjudicator = Signer(7891011)
notary = Signer(12345)
other = Signer(234852304958)

applicant_eth_address = 0x1234
profile_cid = 1234567


@pytest.fixture(scope="module")
def event_loop():
    return asyncio.new_event_loop()


def get_contract_path(path):
    return os.path.join(os.path.dirname(__file__), path)


async def deploy_and_initialize_account(starknet, signer):
    account = await starknet.deploy(get_contract_path("OpenZepplin/Account.cairo"))
    await account.initialize(signer.public_key, account.contract_address, 0).invoke()
    return account


@pytest.fixture(scope="module")
async def ctx():
    starknet = await Starknet.empty()

    notary_account = await deploy_and_initialize_account(starknet, notary)
    adjudicator_account = await deploy_and_initialize_account(starknet, adjudicator)

    nym = await starknet.deploy(get_contract_path("nym.cairo"))
    await nym.initialize(
        notary_address=notary_account.contract_address,
        adjudicator_address=adjudicator_account.contract_address,
    ).invoke()

    return SimpleNamespace(
        starknet=starknet,
        notary_account=notary_account,
        adjudicator_account=adjudicator_account,
        nym=nym,
    )


@pytest.mark.asyncio
async def test_submit_via_notary(ctx):

    """
    private_key = 1
    user = generate_public_key(private_key)
    (message_hash, (sig_r, sig_s)) = sign_message(private_key, profile)
    """

    async def submit_via_notary():
        address = 123
        created_timestamp = int(time.time())
        await notary.send_transaction(
            ctx.notary_account,
            ctx.nym.contract_address,
            "submit_via_notary",
            [applicant_eth_address, profile_cid, address, created_timestamp],
        )

    await submit_via_notary()

    # ensure result is in contract storage
    assert await ctx.nym.get_profile_value(
        eth_address=applicant_eth_address, index=0
    ).call() == (profile_cid,)

    # applying a second time should result in an error, because the
    # profile already exists
    with pytest.raises(StarkException) as e_info:
        await submit_via_notary()
    # XXX: it would be nice if we could explicitly check that an assert failed
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED
