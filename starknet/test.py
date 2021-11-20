# Using Starkware's testing library directly in python because:
# 1. It doesn't break during cairo updates
# 2. It has `copy()` which will be important for running tests efficiently

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
    erc20 = await starknet.deploy(
        source=get_contract_path("OpenZepplin/ERC20.cairo"),
        constructor_calldata=[minter_account.contract_address],
    )

    def uint(a):
        return (a, 0)

    async def give_tokens(recipient, amount):
        return await minter.send_transaction(
            minter_account,
            erc20.contract_address,
            "transfer",
            [recipient, *uint(amount)],
        )

    async def approve(approver, approver_account, spender_address, amount):
        return await approver.send_transaction(
            approver_account,
            erc20.contract_address,
            "approve",
            [spender_address, *uint(amount)],
        )

    return (erc20, give_tokens, approve)


@pytest.fixture(scope="module")
def event_loop():
    return asyncio.new_event_loop()


@pytest.fixture(scope="module")
async def ctx():
    starknet = await Starknet.empty()

    mirror = await starknet.deploy(source=get_contract_path("mirror.cairo"))

    admin_account = await deploy_and_initialize_account(starknet, admin)
    notary_account = await deploy_and_initialize_account(starknet, notary)
    adjudicator_account = await deploy_and_initialize_account(starknet, adjudicator)
    challenger_account = await deploy_and_initialize_account(starknet, challenger)

    super_adjudicator_l1_address = 0

    (erc20, give_tokens, approve) = await create_erc20(starknet)

    nym = await starknet.deploy(
        source=get_contract_path("nym.cairo"),
        constructor_calldata=[
            admin_account.contract_address,
            notary_account.contract_address,
            adjudicator_account.contract_address,
            super_adjudicator_l1_address,
            erc20.contract_address,
            mirror.contract_address,
        ],
    )

    # Give tokens to the notary so they can submit profiles
    await give_tokens(notary_account.contract_address, SUBMISSION_DEPOSIT_SIZE * 2)

    # Give 50 tokens to the eventual challenger so they can afford to challenge
    await give_tokens(challenger_account.contract_address, CHALLENGE_DEPOSIT_SIZE * 2)

    # Give remaining tokens to the nym contract (its shared security pool)
    await give_tokens(
        nym.contract_address,
        1000 - SUBMISSION_DEPOSIT_SIZE * 2 - CHALLENGE_DEPOSIT_SIZE * 2,
    )

    return SimpleNamespace(
        starknet=starknet,
        notary_account=notary_account,
        adjudicator_account=adjudicator_account,
        challenger_account=challenger_account,
        super_adjudicator_l1_address=super_adjudicator_l1_address,
        nym=nym,
        erc20=erc20,
        erc20_operations=SimpleNamespace(approve=approve),
    )


async def submit(ctx, cid, address):
    print(ctx)

    await ctx.erc20_operations.approve(
        notary, ctx.notary_account, ctx.nym.contract_address, SUBMISSION_DEPOSIT_SIZE
    )

    await notary.send_transaction(
        ctx.notary_account,
        ctx.nym.contract_address,
        "submit",
        [
            cid,
            address,
        ],
    )

    (profile_id, profile) = (
        await ctx.nym.get_profile_by_address(address).call()
    ).result

    return (profile_id, profile)


async def get_is_address_confirmed(ctx, address):
    (is_person,) = (
        await ctx.nym.get_is_address_confirmed(address=address).call()
    ).result
    return is_person


@pytest.mark.asyncio
async def test_notary_submit(ctx):
    address = 123
    cid = 1234567
    (profile_id, profile) = await submit(ctx, cid, address)

    assert profile.cid == cid
    assert profile.address == address
    assert profile.is_notarized == 1

    print("profile_id", profile_id)

    (profile, challenge_storage) = (
        await ctx.nym.export_profile_by_id(profile_id).call()
    ).result

    print("challenge_storage", challenge_storage)

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
