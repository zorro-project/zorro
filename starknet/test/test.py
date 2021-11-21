import pytest
from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode
from OpenZepplin.Signer import Signer
from utils import uint


async def get_is_address_confirmed(ctx, address):
    (is_confirmed,) = (
        await ctx.nym.get_is_address_confirmed(address=address).call()
    ).result
    return is_confirmed


async def get_challenge_status(ctx, profile_id):
    (challenge_status,) = (await ctx.nym.get_challenge_status(profile_id).call()).result
    return challenge_status


async def export_profile_by_id(ctx, profile_id):
    (profile, challenge_storage) = (
        await ctx.nym.export_profile_by_id(profile_id).call()
    ).result
    return (profile, challenge_storage)


async def erc20_approve(ctx, account_name, amount):
    await ctx.execute(
        account_name,
        ctx.erc20.contract_address,
        "approve",
        [ctx.nym.contract_address, *uint(amount)],
    )


async def submit(ctx, account_name, cid, address):
    await erc20_approve(ctx, account_name, ctx.consts.SUBMISSION_DEPOSIT_SIZE)
    await ctx.execute(account_name, ctx.nym.contract_address, "submit", [cid, address])

    (profile_id, profile) = (
        await ctx.nym.get_profile_by_address(address).call()
    ).result

    return (profile_id, profile)


@pytest.mark.asyncio
async def test_notary_submit(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567

    # TODO: check balance before

    (profile_id, profile) = await submit(ctx, "notary", cid, address)

    # TODO: check balance after

    assert profile.cid == cid
    assert profile.address == address
    assert profile.is_notarized == 1


@pytest.mark.asyncio
async def test_submit_ensures_unique_address(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    await submit(ctx, "notary", cid, address)
    with pytest.raises(StarkException) as e_info:
        await submit(ctx, "notary", cid, address)
    assert e_info.value.code == StarknetErrorCode.TRANSACTION_FAILED


@pytest.mark.asyncio
async def test_challenge(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    (profile_id, profile) = await submit(ctx, "notary", cid, address)

    assert await get_challenge_status(ctx, profile_id) == 0

    # should already be confirmed, because submitted by a notary
    assert await get_is_address_confirmed(ctx, address) == 1

    evidence_cid = 100
    await erc20_approve(ctx, "challenger", ctx.consts.CHALLENGE_DEPOSIT_SIZE)
    await ctx.execute(
        "challenger", ctx.nym.contract_address, "challenge", [profile_id, evidence_cid]
    )

    assert await get_challenge_status(ctx, profile_id) != 0

    (profile, challenge_storage) = await export_profile_by_id(ctx, profile_id)

    assert challenge_storage.last_recorded_status == 1
    assert challenge_storage.challenge_evidence_cid == evidence_cid
    assert (
        challenge_storage.challenger_address == ctx.accounts.challenger.contract_address
    )

    # Being challenged during provisional time window should result in profile being not confirmed
    assert await get_is_address_confirmed(ctx, address) == 0


@pytest.mark.asyncio
async def test_adjudication_in_favor_of_profile(ctx_factory):
    ctx = ctx_factory()
    cid = 123
    address = 789
    (profile_id, profile) = await submit(ctx, "notary", cid, address)
    assert await get_is_address_confirmed(ctx, address) == 1

    await erc20_approve(ctx, "challenger", ctx.consts.CHALLENGE_DEPOSIT_SIZE)
    await ctx.execute(
        "challenger", ctx.nym.contract_address, "challenge", [profile_id, 1234]
    )
    assert await get_is_address_confirmed(ctx, address) == 0

    adjudicator_evidence_cid = 900
    await ctx.execute(
        "adjudicator",
        ctx.nym.contract_address,
        "adjudicate",
        [profile_id, adjudicator_evidence_cid, 1],
    )

    (profile, challenge_storage) = await export_profile_by_id(ctx, profile_id)
    print(challenge_storage)

    assert challenge_storage.last_recorded_status == 2
    assert challenge_storage.adjudicator_evidence_cid == adjudicator_evidence_cid
    assert challenge_storage.did_adjudicator_confirm_profile == 1

    assert await get_is_address_confirmed(ctx, address) == 1
    assert await get_challenge_status(ctx, profile_id) == 2


@pytest.mark.asyncio
async def test_others_cannot_adjudicate(ctx_factory):
    ctx = ctx_factory()
    pass


@pytest.mark.asyncio
async def test_others_cannot_notarize(ctx_factory):
    # test submitting and make sure not notarized after
    # test cannot notarize()
    ctx = ctx_factory()
    pass


@pytest.mark.asyncio
async def test_confirmation_during_provisional_window(ctx_factory):
    # Submit from a non-notary
    # Wait x amount of time
    # Check again
    ctx = ctx_factory()
    pass
