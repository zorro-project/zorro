import pytest
from collections import Counter

from starkware.starkware_utils.error_handling import StarkException
from starkware.starknet.definitions.error_codes import StarknetErrorCode

from OpenZeppelin.Signer import Signer

from utils import uint


async def _erc20_approve(ctx, account_name, amount):
    await ctx.execute(
        account_name,
        ctx.erc20.contract_address,
        "approve",
        [ctx.zorro.contract_address, *uint(amount)],
    )


async def _donate_to_security_pool(ctx, account_name, amount):
    await _erc20_approve(ctx, account_name, amount)
    await ctx.execute(
        account_name, ctx.zorro.contract_address, "donate_to_security_pool", [amount]
    )


async def _get_balance(ctx, address):
    return (await ctx.erc20.balance_of(address).call()).result.res.low


async def _submit(ctx, account_name, cid, ethereum_address):
    await _erc20_approve(ctx, account_name, ctx.consts.SUBMISSION_DEPOSIT_SIZE)
    await ctx.execute(
        account_name,
        ctx.zorro.contract_address,
        "submit",
        [cid, ethereum_address],
    )

    (profile_id, _) = (
        await ctx.zorro.get_profile_by_ethereum_address(ethereum_address).call()
    ).result
    return profile_id


async def _maybe_return_submission_deposit(ctx, profile_id):
    await ctx.execute(
        "rando",
        ctx.zorro.contract_address,
        "maybe_return_submission_deposit",
        [profile_id],
    )


async def _get_balances(ctx):
    return Counter(
        notary=(await _get_balance(ctx, ctx.notary.contract_address)),
        challenger=(await _get_balance(ctx, ctx.challenger.contract_address)),
        rando=(await _get_balance(ctx, ctx.rando.contract_address)),
        zorro=(await _get_balance(ctx, ctx.zorro.contract_address)),
        zorro_security_pool=(
            await ctx.zorro.get_security_pool_balance().call()
        ).result.res,
    )


async def _challenge(ctx, account_name, profile_id, evidence_cid):
    await _erc20_approve(ctx, account_name, ctx.consts.CHALLENGE_DEPOSIT_SIZE)
    await ctx.execute(
        account_name,
        ctx.zorro.contract_address,
        "challenge",
        [profile_id, evidence_cid],
    )


async def _adjudicate(ctx, profile_id, evidence_cid, should_verify):
    await ctx.execute(
        "adjudicator",
        ctx.zorro.contract_address,
        "adjudicate",
        [profile_id, evidence_cid, should_verify],
    )


async def _appeal(ctx, profile_id, appeal_id, from_address=None):
    if from_address == None:
        from_address = ctx.consts.SUPER_ADJUDICATOR_L1_ADDRESS
    await ctx.starknet.send_message_to_l2(
        from_address,
        ctx.zorro.contract_address,
        "appeal",
        [profile_id, appeal_id],
    )


async def _super_adjudicate(
    ctx, profile_id, appeal_id, should_overturn, from_address=None
):
    if from_address == None:
        from_address = ctx.consts.SUPER_ADJUDICATOR_L1_ADDRESS
    await ctx.starknet.send_message_to_l2(
        from_address,
        ctx.zorro.contract_address,
        "super_adjudicate",
        [profile_id, appeal_id, should_overturn],
    )


async def _maybe_settle(ctx, profile_id):
    await ctx.execute(
        "rando",
        ctx.zorro.contract_address,
        "maybe_settle",
        [profile_id],
    )


async def _get_is_verified(ctx, ethereum_address):
    (is_verified,) = (
        await ctx.zorro.get_is_ethereum_address_verified(ethereum_address).call()
    ).result
    return is_verified


# async def _get_current_status(ctx, profile_id):
#     (_, _, status) = (await ctx.zorro.export_profile_by_id(profile_id).call()).result
#     return status


class ScenarioState:
    ctx = None
    profile_id = None
    ethereum_address = None
    appeal_id = None

    def __init__(self, ctx):
        self.ctx = ctx

    async def submit(self, via_notary=True, cid=100, ethereum_address=1234):
        submitter_name = "notary" if via_notary else "rando"
        profile_id = await _submit(self.ctx, submitter_name, cid, ethereum_address)
        self.profile_id = profile_id
        self.ethereum_address = ethereum_address

    async def maybe_return_submission_deposit(self):
        await _maybe_return_submission_deposit(self.ctx, self.profile_id)

    async def challenge(self, evidence_cid=200):
        await _challenge(self.ctx, "challenger", self.profile_id, evidence_cid)

    async def get_is_verified(self):
        return await _get_is_verified(self.ctx, self.ethereum_address)

    # Waits one second more than the named duration by default, because
    # we don't care about about `<=`` vs `<`` when it comes to time
    async def named_wait(self, name=None, offset=1):
        time_windows = self.ctx.consts.time_windows
        does_period_exist = hasattr(time_windows, name)
        if not does_period_exist:
            raise f"The time window named {name} doesn't exist"

        self.ctx.advance_clock(getattr(time_windows, name) + offset)

    async def wait(self, duration):
        self.ctx.advance_clock(duration)

    async def adjudicate(self, should_verify, evidence_cid=300):
        await _adjudicate(self.ctx, self.profile_id, evidence_cid, should_verify)

    async def appeal(self, appeal_id=1, from_address=None):
        self.appeal_id = appeal_id
        await _appeal(self.ctx, self.profile_id, appeal_id, from_address)

    async def super_adjudicate(self, should_overturn, from_address=None):
        await _super_adjudicate(
            self.ctx,
            self.profile_id,
            self.appeal_id or 123,
            should_overturn,
            from_address,
        )

    async def maybe_settle(self):
        await _maybe_settle(self.ctx, self.profile_id)

    async def _export_profile(self):
        return await self.ctx.zorro.export_profile_by_id(self.profile_id).call()


VERIFIED = "verified"
NOT_VERIFIED = "not_verified"
TX_REJECTED = "rejected"


async def run_scenario(ctx, scenario):
    scenario_state = ScenarioState(ctx)
    for (function_name, kwargs, expected_outcome) in scenario:
        if expected_outcome not in [VERIFIED, NOT_VERIFIED, TX_REJECTED]:
            raise f"Invalid expected outcome '{expected_outcome}'"

        func = getattr(scenario_state, function_name, None)
        if not func:
            raise AttributeError(f"ScenarioState.{function_name} doesn't exist.")

        print("Running", function_name, kwargs)

        try:
            await func(**kwargs)
        except StarkException as e:
            if expected_outcome == TX_REJECTED:
                assert e.code == StarknetErrorCode.TRANSACTION_FAILED
            else:
                raise e

        if expected_outcome == VERIFIED or expected_outcome == NOT_VERIFIED:
            is_verified = await scenario_state.get_is_verified()

            if {VERIFIED: 1, NOT_VERIFIED: 0}[expected_outcome] != is_verified:
                print(
                    "Profile state prior to failure",
                    (await scenario_state._export_profile()),
                )

            assert {VERIFIED: 1, NOT_VERIFIED: 0}[expected_outcome] == is_verified


# To be more exhaustive and less reptitive, we could build scenarios in a branching tree:
# def get_scenario_tree():
#     return [
#         *get_post_submit_scenarios([("submit", dict(is_notarized=True), VERIFIED)]),
#         *get_post_submit_scenarios(
#             [("submit", dict(is_notarized=False), NOT_VERIFIED)]
#         ),
#     ]


def get_scenario_pairs():

    #
    # Submission
    #

    notary_submit_scenario = [
        ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), VERIFIED),
    ]

    duplicate_address_scenario = notary_submit_scenario + [
        ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), TX_REJECTED),
    ]

    self_submit_scenario = [
        (
            "submit",
            dict(via_notary=False, cid=100, ethereum_address=1234),
            NOT_VERIFIED,
        ),
    ]

    self_submit_and_wait_scenario = self_submit_scenario + [
        ("wait", dict(duration=60), NOT_VERIFIED),
        ("named_wait", dict(name="PROVISIONAL_PERIOD"), VERIFIED),
    ]

    #
    # Challenges
    #

    notary_submit_and_challenge_scenario = notary_submit_scenario + [
        ("challenge", dict(), NOT_VERIFIED),
    ]

    notary_submit_and_wait_past_provisional_window_and_challenge_scenario = (
        notary_submit_scenario
        + [
            ("named_wait", dict(name="PROVISIONAL_PERIOD"), VERIFIED),
            ("challenge", dict(), VERIFIED),
        ]
    )

    #
    # Adjudication
    #

    adj_yes_scenario = notary_submit_and_challenge_scenario + [
        ("adjudicate", dict(should_verify=1), VERIFIED),
    ]

    adj_no_scenario = notary_submit_and_challenge_scenario + [
        ("adjudicate", dict(should_verify=0), NOT_VERIFIED),
    ]

    # Can't adjudicate after timeout
    adj_timeout_scenario = notary_submit_and_challenge_scenario + [
        ("named_wait", dict(name="ADJUDICATION_PERIOD"), NOT_VERIFIED),
        ("adjudicate", dict(should_verify=1), TX_REJECTED),
    ]

    #
    # Appeals
    #

    adj_yes_and_appeal_scenario = adj_yes_scenario + [
        ("appeal", dict(), VERIFIED),
    ]

    adj_no_and_appeal_scenario = adj_no_scenario + [
        ("appeal", dict(), NOT_VERIFIED),
    ]

    # Can still appeal if adjudication times out
    adj_timeout_and_appeal_scenario = adj_timeout_scenario + [
        ("appeal", dict(), NOT_VERIFIED),
    ]

    # Can't appeal from the wrong address
    adj_yes_and_appeal_from_wrong_address_scenario = adj_yes_scenario + [
        ("appeal", dict(from_address=12345), TX_REJECTED),
    ]

    adj_yes_and_appeal_timeout_scenario = adj_yes_scenario + [
        ("named_wait", dict(name="APPEAL_PERIOD"), VERIFIED),
    ]

    adj_no_and_appeal_timeout_scenario = adj_no_scenario + [
        ("named_wait", dict(name="APPEAL_PERIOD"), NOT_VERIFIED),
    ]

    # Can't appeal after timeout
    adj_yes_and_appeal_timeout_and_attempt_appeal_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("appeal", dict(), TX_REJECTED),
        ]
    )

    #
    # Super adjudication
    #

    # all 2x2 combinations
    adj_no_superadj_uphold_scenario = adj_no_and_appeal_scenario + [
        ("super_adjudicate", dict(should_overturn=0), NOT_VERIFIED),
    ]
    adj_no_superadj_overturn_scenario = adj_no_and_appeal_scenario + [
        ("super_adjudicate", dict(should_overturn=1), VERIFIED),
    ]
    adj_yes_superadj_uphold_scenario = adj_yes_and_appeal_scenario + [
        ("super_adjudicate", dict(should_overturn=0), VERIFIED),
    ]
    adj_yes_superadj_overturn_scenario = adj_yes_and_appeal_scenario + [
        ("super_adjudicate", dict(should_overturn=1), NOT_VERIFIED),
    ]

    # can super adjudicate an appeal of a timed-out adjudication
    adj_timeout_and_appeal_and_superadj_uphold_scenario = (
        adj_timeout_and_appeal_scenario
        + [
            ("super_adjudicate", dict(should_overturn=0), NOT_VERIFIED),
        ]
    )

    adj_timeout_and_appeal_and_superadj_overturn_scenario = (
        adj_timeout_and_appeal_scenario
        + [
            ("super_adjudicate", dict(should_overturn=1), VERIFIED),
        ]
    )

    # can't super_adjudicate after appeal expired
    adj_yes_and_appeal_timeout_and_attempt_superadj_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("super_adjudicate", dict(should_overturn=0), TX_REJECTED),
        ]
    )

    # can't super_adjudicate from wrong address
    adj_yes_and_attempt_superadj_from_wrong_address_scenario = (
        adj_yes_and_appeal_scenario
        + [
            (
                "super_adjudicate",
                dict(should_overturn=1, from_address=9876),
                TX_REJECTED,
            ),
        ]
    )

    # can't super_adjudicate after timeout
    adj_no_and_appeal_and_superadj_timeout_and_attempt_superadj_scenario = (
        adj_no_and_appeal_scenario
        + [
            ("named_wait", dict(name="SUPER_ADJUDICATION_PERIOD"), NOT_VERIFIED),
            ("super_adjudicate", dict(should_overturn=0), TX_REJECTED),
        ]
    )

    # adjudication AND super adjudication timeout --> fail safe by assuming challenger is correct, even if challenge came after provisional time window
    all_timed_out_scenario = (
        notary_submit_and_wait_past_provisional_window_and_challenge_scenario
        + [
            ("named_wait", dict(name="ADJUDICATION_PERIOD"), NOT_VERIFIED),
            ("appeal", dict(), NOT_VERIFIED),
            ("named_wait", dict(name="SUPER_ADJUDICATION_PERIOD"), NOT_VERIFIED),
        ]
    )

    #
    # Settling
    #

    # Cn settle from appeal timeout state
    adj_yes_and_appeal_timeout_and_settle_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("maybe_settle", dict(), VERIFIED),
        ]
    )
    adj_no_and_appeal_timeout_and_settle_scenario = (
        adj_no_and_appeal_timeout_scenario
        + [
            ("maybe_settle", dict(), NOT_VERIFIED),
        ]
    )

    # Can settle from super adjudication complete state
    adj_no_superadj_overturn_and_settle_scenario = adj_no_superadj_overturn_scenario + [
        ("maybe_settle", dict(), VERIFIED),
    ]
    adj_no_superadj_uphold_and_settle_scenario = adj_yes_superadj_overturn_scenario + [
        ("maybe_settle", dict(), NOT_VERIFIED),
    ]

    #
    # Rechallenging
    #

    # Can rechallenge after appeal timed out
    adj_yes_and_appeal_timeout_and_rechallenge_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("named_wait", dict(name="PROVISIONAL_PERIOD"), VERIFIED),
            ("challenge", dict(), VERIFIED),  # presumed innocent
        ]
    )

    # Can rechallenge from unsettled status
    adj_no_superadj_overturn_and_rechallenge_scenario = adj_no_superadj_overturn_scenario + [
        (
            "challenge",
            dict(),
            NOT_VERIFIED,
        )  # not presumed innocent because there was no delay — we're still in provisional time window! (unrealistically fast rechallenge)
    ]

    # Can rechallenge from settled status
    adj_no_superadj_uphold_and_settle_and_rechallenge_scenario = adj_no_superadj_overturn_and_settle_scenario + [
        ("challenge", dict(), NOT_VERIFIED)
    ]  # we rechallenged so quickly that they are still presumed not innocent, hence NOT_VERIFIED

    # cannot rechallenge profiles that are already deemed unverified
    settle_and_attempt_rechallenge_scenario = (
        adj_no_superadj_uphold_and_settle_scenario
        + [("challenge", dict(), TX_REJECTED)]
    )

    # Collect all scenarios
    return [
        (name, scenario)
        for (name, scenario) in locals().items()
        if (isinstance(scenario, list))
    ]


scenario_pairs = get_scenario_pairs()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario_pair", scenario_pairs, ids=map(lambda x: x[0], scenario_pairs)
)
async def test_scenario(ctx_factory, scenario_pair):
    ctx = ctx_factory()
    (scenario_name, scenario) = scenario_pair
    print("Starting scenario", scenario_name, scenario)
    await run_scenario(ctx, scenario)


def get_balance_deltas(pre_balances, post_balances):
    return {key: post_balances[key] - pre_balances[key] for key in post_balances.keys()}


@pytest.mark.asyncio
async def test_settle_where_challenger_loses(ctx_factory):
    ctx = ctx_factory()

    pre_balances = await _get_balances(ctx)
    await run_scenario(
        ctx,
        [
            ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), VERIFIED),
            ("challenge", dict(), NOT_VERIFIED),
            ("adjudicate", dict(should_verify=1), VERIFIED),
            ("named_wait", dict(name="APPEAL_PERIOD"), VERIFIED),
            ("maybe_settle", dict(), VERIFIED),
        ],
    )
    post_balances = await _get_balances(ctx)
    deltas = get_balance_deltas(pre_balances, post_balances)

    assert deltas["notary"] == 0
    assert deltas["challenger"] == -ctx.consts.CHALLENGE_DEPOSIT_SIZE
    assert deltas["zorro"] == ctx.consts.CHALLENGE_DEPOSIT_SIZE
    assert deltas["zorro_security_pool"] == ctx.consts.CHALLENGE_DEPOSIT_SIZE


@pytest.mark.asyncio
async def test_settle_where_challenger_wins_deposit_from_submitter(ctx_factory):
    ctx = ctx_factory()

    pre_balances = await _get_balances(ctx)
    await run_scenario(
        ctx,
        [
            ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), VERIFIED),
            ("challenge", dict(), NOT_VERIFIED),
            ("named_wait", dict(name="ADJUDICATION_PERIOD"), NOT_VERIFIED),
            ("named_wait", dict(name="APPEAL_PERIOD"), NOT_VERIFIED),
            ("maybe_settle", dict(), NOT_VERIFIED),
        ],
    )
    post_balances = await _get_balances(ctx)
    deltas = get_balance_deltas(pre_balances, post_balances)

    assert deltas["notary"] == -ctx.consts.SUBMISSION_DEPOSIT_SIZE
    assert deltas["challenger"] == ctx.consts.CHALLENGE_REWARD_SIZE
    assert deltas["zorro"] == 0
    assert deltas["zorro_security_pool"] == 0


@pytest.mark.asyncio
async def test_settle_where_challenger_wins_reward_from_security_pool(ctx_factory):
    ctx = ctx_factory()

    DONATION_AMOUNT = 100
    await _donate_to_security_pool(ctx, "rando", DONATION_AMOUNT)

    pre_balances = await _get_balances(ctx)
    assert pre_balances["zorro_security_pool"] == DONATION_AMOUNT
    await run_scenario(
        ctx,
        [
            ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), VERIFIED),
            ("named_wait", dict(name="PROVISIONAL_PERIOD"), VERIFIED),
            ("maybe_return_submission_deposit", dict(), VERIFIED),
            ("challenge", dict(), VERIFIED),
            ("adjudicate", dict(should_verify=0), NOT_VERIFIED),
            ("named_wait", dict(name="APPEAL_PERIOD"), NOT_VERIFIED),
            ("maybe_settle", dict(), NOT_VERIFIED),
        ],
    )
    post_balances = await _get_balances(ctx)
    deltas = get_balance_deltas(pre_balances, post_balances)
    print(pre_balances, post_balances, deltas)

    assert deltas["notary"] == 0
    assert deltas["challenger"] == ctx.consts.CHALLENGE_REWARD_SIZE
    assert deltas["zorro"] == -ctx.consts.CHALLENGE_REWARD_SIZE
    assert deltas["zorro_security_pool"] == -ctx.consts.CHALLENGE_REWARD_SIZE


@pytest.mark.asyncio
async def test_settle_where_challenger_would_win_reward_but_for_empty_security_pool(
    ctx_factory,
):
    ctx = ctx_factory()

    pre_balances = await _get_balances(ctx)
    await run_scenario(
        ctx,
        [
            ("submit", dict(via_notary=True, cid=100, ethereum_address=1234), VERIFIED),
            ("named_wait", dict(name="PROVISIONAL_PERIOD"), VERIFIED),
            ("maybe_return_submission_deposit", dict(), VERIFIED),
            ("challenge", dict(), VERIFIED),
            ("adjudicate", dict(should_verify=0), NOT_VERIFIED),
            ("named_wait", dict(name="APPEAL_PERIOD"), NOT_VERIFIED),
            ("maybe_settle", dict(), NOT_VERIFIED),
        ],
    )
    post_balances = await _get_balances(ctx)
    deltas = get_balance_deltas(pre_balances, post_balances)

    assert deltas["notary"] == 0
    assert deltas["challenger"] == 0
    assert deltas["zorro"] == 0
    assert deltas["zorro_security_pool"] == 0


@pytest.mark.asyncio
async def test_adding_seed_profiles(
    ctx_factory,
):
    ctx = ctx_factory()

    await ctx.zorro._dev_add_seed_profiles().invoke()

    (num_profiles,) = (await ctx.zorro.get_num_profiles().call()).result
    assert num_profiles > 0
