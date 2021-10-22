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
challenger = Signer(888333444555)

applicant_eth_address = 0x1234

profile_cid_low = 1234567
profile_cid_high = 453430


@pytest.fixture(scope="module")
def event_loop():
    return asyncio.new_event_loop()


def get_contract_path(path):
    return os.path.join(os.path.dirname(__file__), path)


async def deploy_and_initialize_account(starknet, signer):
    account = await starknet.deploy(get_contract_path("OpenZepplin/Account.cairo"))
    await account.initialize(signer.public_key, account.contract_address, 0).invoke()
    return account


async def create_erc20(starknet):
    minter = Signer(897654321)
    minter_account = await deploy_and_initialize_account(starknet, minter)
    erc20 = await starknet.deploy(get_contract_path("OpenZepplin/ERC20.cairo"))
    # Initializing the ERC20 contract mints 1000 tokens to the sender of the
    # initialization transaction (in this case, `treasurer`.)
    await minter.send_transaction(
        minter_account, erc20.contract_address, "initialize", []
    )

    async def give_tokens(recipient, amount):
        return await minter.send_transaction(
            minter_account,
            erc20.contract_address,
            "transfer",
            [recipient, amount],
        )

    return give_tokens


@pytest.fixture(scope="module")
async def ctx():
    starknet = await Starknet.empty()

    notary_account = await deploy_and_initialize_account(starknet, notary)
    adjudicator_account = await deploy_and_initialize_account(starknet, adjudicator)
    challenger_account = await deploy_and_initialize_account(starknet, challenger)

    nym = await starknet.deploy(get_contract_path("nym.cairo"))
    await nym.initialize(
        notary_address=notary_account.contract_address,
        adjudicator_address=adjudicator_account.contract_address,
    ).invoke()

    give_tokens = await create_erc20(starknet)

    # Give 50 tokens to the eventual challenger so they can afford to challenge
    await give_tokens(challenger_account.contract_address, 50)

    # Give 950 tokens to the nym contract (its shared security pool)
    await give_tokens(nym.contract_address, 950)

    return SimpleNamespace(
        starknet=starknet,
        notary_account=notary_account,
        adjudicator_account=adjudicator_account,
        nym=nym,
    )


@pytest.mark.asyncio
async def test_submit_via_notary(ctx):
    async def submit_via_notary():
        address = 123
        created_timestamp = int(time.time())
        await notary.send_transaction(
            ctx.notary_account,
            ctx.nym.contract_address,
            "submit_via_notary",
            [
                applicant_eth_address,
                profile_cid_low,
                profile_cid_high,
                address,
                created_timestamp,
            ],
        )

    await submit_via_notary()

    # ensure result is in contract storage
    assert await ctx.nym.get_profile_value(
        eth_address=applicant_eth_address, index=0
    ).call() == (profile_cid_low,)

    # applying a second time should result in an error, because the
    # profile already exists
    with pytest.raises(StarkException) as e_info:
        await submit_via_notary()
    # XXX: it would be nice if we could explicitly check that an assert failed
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED
