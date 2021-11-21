import pytest
from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode
from OpenZepplin.Signer import Signer
from utils import uint


async def submit(ctx, cid, address):
    # Approve erc20
    await ctx.execute(
        "notary",
        ctx.erc20.contract_address,
        "approve",
        [ctx.nym.contract_address, *uint(ctx.consts.SUBMISSION_DEPOSIT_SIZE)],
    )

    # Submit profile
    await ctx.execute("notary", ctx.nym.contract_address, "submit", [cid, address])

    (profile_id, profile) = (
        await ctx.nym.get_profile_by_address(address).call()
    ).result

    return (profile_id, profile)


# async def get_is_address_confirmed(ctx, address):
#     (is_person,) = (
#         await ctx.nym.get_is_address_confirmed(address=address).call()
#     ).result
#     return is_person


@pytest.mark.asyncio
async def test_notary_submit(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    (profile_id, profile) = await submit(ctx, cid, address)

    assert profile.cid == cid
    assert profile.address == address
    assert profile.is_notarized == 1


@pytest.mark.asyncio
async def test_submit_ensures_unique_address(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    await submit(ctx, cid, address)
    with pytest.raises(StarkException) as e_info:
        await submit(ctx, cid, address)
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED


@pytest.mark.asyncio
async def test_challenge(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    (profile_id, profile) = await submit(ctx, cid, address)
    assert await get_is_person(ctx, address) == 1


"""
@pytest.mark.asyncio
async def test_challenge_and_adjudication(ctx):
    eth_address = 0x234324
    address = 321

    # TODO: confirm status
    # TODO: confirm get_is_person result
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
