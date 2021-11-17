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

from utils.OpenZepplin.Signer import Signer

admin = Signer(83745982347)
adjudicator = Signer(7891011)
notary = Signer(12345)
challenger = Signer(888333444555)

SUBMISSION_DEPOSIT_SIZE = 25  # This constant is also in nym.cairo
CHALLENGE_DEPOSIT_SIZE = 25  # This constant is also in nym.cairo

# Note: could use a factory clone method to speed up tests, like this:
# https://github.com/fracek/starknet-pythonic-template/blob/main/tests/starknet/test_counter.py
# Or maybe could avoid compilation time by caching compiled json


def get_contract_path(path):
    return os.path.join(os.path.dirname(__file__), "contracts", path)


async def deploy_and_initialize_account(starknet, signer):
    account = await starknet.deploy(
        source=get_contract_path("OpenZepplin/Account.cairo"),
        constructor_calldata=[signer.public_key],
    )
    await account.initialize(account.contract_address).invoke()
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

    return (erc20, give_tokens)


@pytest.fixture(scope="module")
def event_loop():
    return asyncio.new_event_loop()


@pytest.fixture(scope="module")
async def ctx():
    starknet = await Starknet.empty()

    admin_account = await deploy_and_initialize_account(starknet, admin)
    notary_account = await deploy_and_initialize_account(starknet, notary)
    adjudicator_account = await deploy_and_initialize_account(starknet, adjudicator)

    challenger_account = await deploy_and_initialize_account(starknet, challenger)

    super_adjudicator_address = 0

    (erc20, give_tokens) = await create_erc20(starknet)

    nym = await starknet.deploy(
        source=get_contract_path("nym.cairo"),
        constructor_calldata=[
            admin_account.contract_address,
            notary_account.contract_address,
            adjudicator_account.contract_address,
            super_adjudicator_address,
            erc20.contract_address,
        ],
    ).invoke()

    # Give 50 tokens to the eventual challenger so they can afford to challenge
    await give_tokens(challenger_account.contract_address, 50)

    # Give 950 tokens to the nym contract (its shared security pool)
    await give_tokens(nym.contract_address, 950)

    return SimpleNamespace(
        starknet=starknet,
        notary_account=notary_account,
        adjudicator_account=adjudicator_account,
        challenger_account=challenger_account,
        super_adjudicator_address=super_adjudicator_address,
        nym=nym,
        erc20=erc20,
    )


async def submit(ctx, cid, address):
    print(ctx)
    await notary.send_transaction(
        ctx.notary_account,
        ctx.nym.contract_address,
        "submit",
        [
            cid,
            address,
        ],
    )

    (profile_id,) = (await ctx.nym.get_profile_by_address(address).call()).result
    return profile_id


async def get_is_address_confirmed(ctx, address):
    (is_person,) = (
        await ctx.nym.get_is_address_confirmed(address=address).call()
    ).result
    return is_person


@pytest.mark.asyncio
async def test_submit(ctx):
    address = 123
    cid = 1234567
    profile_id = await submit(ctx, cid, address)

    # ensure result is in contract storage
    assert (await ctx.nym.__get_profile_cid_low(profile_id).call()).result == (cid,)

    # applying a second time should result in an error, because the
    # profile already exists
    with pytest.raises(StarkException) as e_info:
        await submit(ctx, cid, address)
    # XXX: it would be nice if we could explicitly check that an assert failed
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED


"""
@pytest.mark.asyncio
async def test_challenge_and_adjudication(ctx):
    eth_address = 0x234324
    address = 321

    async def get_challenger_balance():
        (balance,) = (
            await ctx.erc20.balance_of(ctx.challenger_account.contract_address).call()
        ).result
        return balance

    profile_id = await submit_with_notarization(
        ctx,
        profile_cid_low=1,
        profile_cid_high=2,
        eth_address=eth_address,
        address=address,
    )

    # TODO: confirm status
    # TODO: confirm get_is_person result
    assert await get_is_person(ctx, address) == 1
    initial_balance = await get_challenger_balance()

    await challenger.send_transaction(
        ctx.challenger_account,
        ctx.erc20.contract_address,
        "approve",
        [ctx.nym.contract_address, 25],
    )
    await challenger.send_transaction(
        ctx.challenger_account,
        ctx.nym.contract_address,
        "challenge",
        [
            profile_id,
            1,
            2,
        ],
    )

    # TODO: confirm status
    assert await get_challenger_balance() == initial_balance - CHALLENGE_DEPOSIT_SIZE
    assert await get_is_person(ctx, address) == 0

    await adjudicator.send_transaction(
        ctx.adjudicator_account,
        ctx.nym.contract_address,
        "adjudicate",
        [
            profile_id,
            1,
        ],
    )

    # TODO: confirm status
    assert await get_challenger_balance() == initial_balance - CHALLENGE_DEPOSIT_SIZE
    assert await get_is_person(ctx, address) == 1

    # TODO: test scenario where final adjudication says the profile is invalid
"""
