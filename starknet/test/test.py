import pytest
from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode
from OpenZeppelin.Signer import Signer
from utils import uint


async def _erc20_approve(ctx, account_name, amount):
    await ctx.execute(
        account_name,
        ctx.erc20.contract_address,
        "approve",
        [ctx.nym.contract_address, *uint(amount)],
    )


# Subsume these into ScenarioState?
async def _submit(ctx, account_name, cid, address):
    await _erc20_approve(ctx, account_name, ctx.consts.SUBMISSION_DEPOSIT_SIZE)
    await ctx.execute(account_name, ctx.nym.contract_address, "submit", [cid, address])
    (profile_id, _) = (await ctx.nym.get_profile_by_address(address).call()).result
    return (profile_id, address)


async def _challenge(ctx, account_name, profile_id, evidence_cid):
    await _erc20_approve(ctx, account_name, ctx.consts.CHALLENGE_DEPOSIT_SIZE)
    await ctx.execute(
        account_name, ctx.nym.contract_address, "challenge", [profile_id, evidence_cid]
    )


async def _adjudicate(ctx, profile_id, evidence_cid, should_confirm):
    await ctx.execute(
        "adjudicator",
        ctx.nym.contract_address,
        "adjudicate",
        [profile_id, evidence_cid, should_confirm],
    )


async def _get_is_confirmed(ctx, address):
    (is_confirmed,) = (await ctx.nym.get_is_confirmed(address=address).call()).result
    return is_confirmed


class ScenarioState:
    ctx = None
    profile_id = None
    address = None

    def __init__(self, ctx):
        self.ctx = ctx

    async def submit(self, via_notary=True, cid=100, address=1234):
        (profile_id, address) = await _submit(
            self.ctx, "notary", cid, address
        )  # XXX: respect notary
        self.profile_id = profile_id
        self.address = address

    async def challenge(self, evidence_cid=200):
        await _challenge(self.ctx, "challenger", self.profile_id, evidence_cid)

    async def get_is_confirmed(self):
        return await _get_is_confirmed(self.ctx, self.address)

    async def wait(ctx):
        pass

    async def adjudicate(self, should_confirm, evidence_cid=300):
        await _adjudicate(self.ctx, self.profile_id, evidence_cid, should_confirm)

    async def appeal(self):
        pass

    async def super_adjudicate(self):
        pass


CONFIRMED = "confirmed"
NOT_CONFIRMED = "not_confirmed"
TX_REJECTED = "rejected"

scenario = [
    ("submit", dict(via_notary=True, cid=100, address=1234), CONFIRMED),
    # (wait, dict(duration=10000), CONFIRMED),
    ("challenge", dict(), NOT_CONFIRMED),
    ("adjudicate", dict(should_confirm=1), CONFIRMED),
]

appeal_window_expired_scenario = scenario + [
    ("wait", dict(duration=1000), CONFIRMED),
    ("appeal", dict(), TX_REJECTED),
]

appealed_scenario = scenario + [
    ("appeal", dict(), CONFIRMED),
]

super_adjudicated_scenario = appealed_scenario + [
    ("super_adjudicate", dict(should_confirm=0), NOT_CONFIRMED),
]


async def run_scenario(ctx, scenario):
    scenario_state = ScenarioState(ctx)
    for (function_name, kwargs, expected_outcome) in scenario:
        func = getattr(scenario_state, function_name, None)
        if not func:
            raise AttributeError(f"ScenarioState.{function_name} doesn't exist.")

        # XXX: handle rejections
        await func(**kwargs)

        is_confirmed = await scenario_state.get_is_confirmed()
        assert {CONFIRMED: 1, NOT_CONFIRMED: 0}[expected_outcome] == is_confirmed


@pytest.mark.asyncio
async def test_scenario(ctx_factory):
    ctx = ctx_factory()

    await run_scenario(ctx, scenario)


"""
async def get_current_status(ctx, profile_id):
    (_, _, status) = (await ctx.nym.export_profile_by_id(profile_id).call()).result
    return status


async def get_profile_by_id(ctx, profile_id):
    (profile,) = (await ctx.nym.get_profile_by_id(profile_id).call()).result
    return profile

async def _super_adjudicate(ctx, profile_id, should_confirm):
    pass


async def _advance_clock(ctx, seconds):
    pass


async def _get_balance(ctx, address):
    pass
"""

"""
@pytest.mark.asyncio
async def test_notary_submit(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    # XXX:: check balance before
    (profile_id, profile) = await submit(ctx, "notary", cid, address)
    # XXX:: check balance after
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
async def test_notary_submit_then_challenge(ctx_factory):
    ctx = ctx_factory()
    address = 123
    cid = 1234567
    (profile_id, profile) = await submit(ctx, "notary", cid, address)
    assert await get_current_status(ctx, profile_id) == 0
    assert (
        await get_is_confirmed(ctx, address) == 1
    )  # was submitted by a notary, so should be confirmed

    # XXX: check balance before and after
    evidence_cid = 200
    await challenge(ctx, "challenger", profile_id, evidence_cid)
    assert await get_current_status(ctx, profile_id) != 0
    profile = await get_profile_by_id(ctx, profile_id)
    assert profile.last_recorded_status == 1
    assert profile.challenge_evidence_cid == evidence_cid
    assert profile.challenger_address == ctx.accounts.challenger.contract_address

    # Being challenged during provisional time window should result in profile being not confirmed
    # XXX: test being challenged after provisional window
    assert await get_is_confirmed(ctx, address) == 0


async def _test_adjudication(ctx, should_confirm):
    cid = 4
    address = 123
    adjudicator_evidence_cid = 900
    (profile_id, profile) = await submit(ctx, "notary", cid, address)
    await challenge(ctx, "challenger", profile_id)
    await adjudicate(ctx, profile_id, adjudicator_evidence_cid, should_confirm)
    profile = await get_profile_by_id(ctx, profile_id)
    assert profile.last_recorded_status == 2
    assert profile.adjudicator_evidence_cid == adjudicator_evidence_cid
    assert profile.did_adjudicator_confirm_profile == should_confirm
    assert await get_is_confirmed(ctx, address) == should_confirm
    assert await get_current_status(ctx, profile_id) == 2


# want to make a tree of scenarios, where we stop at every leaf with an expected answer...
# test them all?
# [
#     dict(action='submit', is_notarized=True, expected_is_confirmed=1)
#     {'action': 'submit', 'is_notarized': True, is_},
#     {'action': 'challenge'},
# ]


def get_scenario_tree():
    return [
        dict(
            action="submit",
            args=dict(is_notarized=True),
            expected_is_confirmed=1,
            next=get_post_submit_scenarios(),
        ),
        dict(
            action="submit",
            args=dict(is_notarized=False),
            expected_is_confirmed=0,
            next=get_post_submit_scenarios(),
        ),
    ]


def get_post_submit_scenarios(was_notarized):
    return [
        dict(
            action="advance_clock",
            amount=10,  # XXX: choose correctly
            expected_is_confirmed=was_notarized,
            next=get_challenge_scenario_tree(),
        ),
        dict(
            action="advance_clock",
            amount=10000,  # XXX: choose correctly
            expected_is_confirmed=1,  # should now be confirmed whether or not was originally notarized
            next=get_challenge_scenario_tree(),
        ),
    ]


2 notarized vs not
2 time+=0, time+=alot
1 challenged
3 time+=0, time+= adjudcation timed out, time+= appeal opportunity expired
2 adjudication yes, adjudication no
2 time+=0, time+=appeal opportunity expired
1 appeal
2 time+=0, time+=super adjudication opportunity expired
1 settle
1 challenge

# =96 scenarios?


# Then do this?
# https://docs.pytest.org/en/stable/example/parametrize.html#set-marks-or-test-id-for-individual-parametrized-test

# async def _test_super_adjudication(ctx, should_adjudicator_confirm, should_super_adjudicator_confirm):
@pytest.mark.asyncio
async def test_adjudication_in_favor_of_profile(ctx_factory):
    ctx = ctx_factory()
    await _test_adjudication(ctx, 1)


@pytest.mark.asyncio
async def test_adjudication_against_profile(ctx_factory):
    ctx = ctx_factory()
    await _test_adjudication(ctx, 0)


@pytest.mark.asyncio
async def test_super_adjudication_against_profile(ctx_factory):
    ctx = ctx_factory()


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


# Test to ensure cannot adjudicate after adjudication window expires

# Test super adjudication in both directions


# Test to ensure cannot adjudicate right after a profile was submitted
# Test to ensure cannot super adjudicate right after a profile was submitted

# Test all possible paths through the tree, with all possible decisions along the way?
"""
