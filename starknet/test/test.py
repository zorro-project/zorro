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


async def _appeal(ctx, profile_id, from_address=None):
    if from_address == None:
        from_address = ctx.consts.SUPER_ADJUDICATOR_L1_ADDRESS
    await ctx.starknet.send_message_to_l2(
        from_address,
        ctx.nym.contract_address,
        "appeal",
        [profile_id],
    )


async def _super_adjudicate(ctx, profile_id, should_confirm, from_address=None):
    if from_address == None:
        from_address = ctx.consts.SUPER_ADJUDICATOR_L1_ADDRESS
    await ctx.starknet.send_message_to_l2(
        from_address,
        ctx.nym.contract_address,
        "super_adjudicate",
        [profile_id, should_confirm],
    )


async def _settle(ctx, profile_id):
    await ctx.execute(
        "rando",
        ctx.nym.contract_address,
        "settle",
        [profile_id],
    )


async def _get_is_confirmed(ctx, address):
    (is_confirmed,) = (await ctx.nym.get_is_confirmed(address=address).call()).result
    return is_confirmed


async def _get_current_status(ctx, profile_id):
    (_, _, status) = (await ctx.nym.export_profile_by_id(profile_id).call()).result
    return status


class ScenarioState:
    ctx = None
    profile_id = None
    address = None

    def __init__(self, ctx):
        self.ctx = ctx

    async def submit(self, via_notary=True, cid=100, address=1234):
        submitter_name = "notary" if via_notary else "rando"
        (profile_id, address) = await _submit(self.ctx, submitter_name, cid, address)
        self.profile_id = profile_id
        self.address = address

    async def challenge(self, evidence_cid=200):
        await _challenge(self.ctx, "challenger", self.profile_id, evidence_cid)

    async def get_is_confirmed(self):
        return await _get_is_confirmed(self.ctx, self.address)

    # Waits one second more than the named duration by default, because
    # we don't care about about `<=`` vs `<`` when it comes to time
    async def named_wait(self, name=None, offset=1):
        time_windows = self.ctx.consts.time_windows
        does_time_window_exist = hasattr(time_windows, name)
        if not does_time_window_exist:
            raise f"The time window named {name} doesn't exist"

        await self.ctx.nym._test_advance_clock(
            getattr(time_windows, name) + offset
        ).invoke()

    async def wait(self, duration):
        await self.ctx.nym._test_advance_clock(duration).invoke()

    async def adjudicate(self, should_confirm, evidence_cid=300):
        await _adjudicate(self.ctx, self.profile_id, evidence_cid, should_confirm)

    async def appeal(self, from_address=None):
        await _appeal(self.ctx, self.profile_id, from_address)

    async def super_adjudicate(self, should_confirm, from_address=None):
        await _super_adjudicate(self.ctx, self.profile_id, should_confirm, from_address)

    async def settle(self):
        await _settle(self.ctx, self.profile_id)

    async def _export_profile(self):
        return await self.ctx.nym.export_profile_by_id(self.profile_id).call()


CONFIRMED = "confirmed"
NOT_CONFIRMED = "not_confirmed"
TX_REJECTED = "rejected"


async def run_scenario(ctx, scenario):
    scenario_state = ScenarioState(ctx)
    for (function_name, kwargs, expected_outcome) in scenario:
        if expected_outcome not in [CONFIRMED, NOT_CONFIRMED, TX_REJECTED]:
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

        if expected_outcome == CONFIRMED or expected_outcome == NOT_CONFIRMED:
            is_confirmed = await scenario_state.get_is_confirmed()

            if {CONFIRMED: 1, NOT_CONFIRMED: 0}[expected_outcome] != is_confirmed:
                print(
                    "Profile state prior to failure",
                    (await scenario_state._export_profile()),
                )

            assert {CONFIRMED: 1, NOT_CONFIRMED: 0}[expected_outcome] == is_confirmed


# To be more exhaustive and less reptitive, we could build scenarios in a branching tree:
# def get_scenario_tree():
#     return [
#         *get_post_submit_scenarios([("submit", dict(is_notarized=True), CONFIRMED)]),
#         *get_post_submit_scenarios(
#             [("submit", dict(is_notarized=False), NOT_CONFIRMED)]
#         ),
#     ]


def get_scenario_pairs():

    #
    # Submission
    #

    notary_submit_scenario = [
        ("submit", dict(via_notary=True, cid=100, address=1234), CONFIRMED),
    ]

    duplicate_address_scenario = notary_submit_scenario + [
        ("submit", dict(via_notary=True, cid=100, address=1234), TX_REJECTED),
    ]

    self_submit_scenario = [
        ("submit", dict(via_notary=False, cid=100, address=1234), NOT_CONFIRMED),
    ]

    self_submit_and_wait_scenario = self_submit_scenario + [
        ("wait", dict(duration=60), NOT_CONFIRMED),
        ("named_wait", dict(name="PROVISIONAL_TIME_WINDOW"), CONFIRMED),
    ]

    #
    # Challenges
    #

    notary_submit_and_challenge_scenario = notary_submit_scenario + [
        ("challenge", dict(), NOT_CONFIRMED),
    ]

    notary_submit_and_wait_past_provisional_window_and_challenge_scenario = (
        notary_submit_scenario
        + [
            ("named_wait", dict(name="PROVISIONAL_TIME_WINDOW"), CONFIRMED),
            ("challenge", dict(), CONFIRMED),
        ]
    )

    #
    # Adjudication
    #

    adj_yes_scenario = notary_submit_and_challenge_scenario + [
        ("adjudicate", dict(should_confirm=1), CONFIRMED),
    ]

    adj_no_scenario = notary_submit_and_challenge_scenario + [
        ("adjudicate", dict(should_confirm=0), NOT_CONFIRMED),
    ]

    # XXX: check that status goes to the correct thing here?
    # Can't adjudicate after timeout
    adj_timeout_scenario = notary_submit_and_challenge_scenario + [
        ("named_wait", dict(name="ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
        ("adjudicate", dict(should_confirm=1), TX_REJECTED),
    ]

    #
    # Appeals
    #

    adj_yes_and_appeal_scenario = adj_yes_scenario + [
        ("appeal", dict(), CONFIRMED),
    ]

    adj_no_and_appeal_scenario = adj_no_scenario + [
        ("appeal", dict(), NOT_CONFIRMED),
    ]

    # Can still appeal if adjudication times out
    adj_timeout_and_appeal_scenario = adj_timeout_scenario + [
        ("appeal", dict(), NOT_CONFIRMED),
    ]

    # Can't appeal from the wrong address
    adj_yes_and_appeal_from_wrong_address_scenario = adj_yes_scenario + [
        ("appeal", dict(from_address=12345), TX_REJECTED),
    ]

    adj_yes_and_appeal_timeout_scenario = adj_yes_scenario + [
        ("named_wait", dict(name="APPEAL_TIME_WINDOW"), CONFIRMED),
    ]

    adj_no_and_appeal_timeout_scenario = adj_no_scenario + [
        ("named_wait", dict(name="APPEAL_TIME_WINDOW"), NOT_CONFIRMED),
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
    adj_no_superadj_no_scenario = adj_no_and_appeal_scenario + [
        ("super_adjudicate", dict(should_confirm=0), NOT_CONFIRMED),
    ]
    adj_no_superadj_yes_scenario = adj_no_and_appeal_scenario + [
        ("super_adjudicate", dict(should_confirm=1), CONFIRMED),
    ]
    adj_yes_superadj_no_scenario = adj_yes_and_appeal_scenario + [
        ("super_adjudicate", dict(should_confirm=0), NOT_CONFIRMED),
    ]
    adj_yes_superadj_yes_scenario = adj_yes_and_appeal_scenario + [
        ("super_adjudicate", dict(should_confirm=1), CONFIRMED),
    ]

    # can super adjudicate an appeal of a timed-out adjudication
    adj_timeout_and_appeal_and_superadj_no_scenario = (
        adj_timeout_and_appeal_scenario
        + [
            ("super_adjudicate", dict(should_confirm=0), NOT_CONFIRMED),
        ]
    )

    adj_timeout_and_appeal_and_superadj_yes_scenario = (
        adj_timeout_and_appeal_scenario
        + [
            ("super_adjudicate", dict(should_confirm=1), CONFIRMED),
        ]
    )

    # can't super_adjudicate after appeal expired
    adj_yes_and_appeal_timeout_and_attempt_superadj_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("super_adjudicate", dict(should_confirm=0), TX_REJECTED),
        ]
    )

    # can't super_adjudicate from wrong address
    adj_yes_superadj_yes_scenario = adj_yes_and_appeal_scenario + [
        ("super_adjudicate", dict(should_confirm=1, from_address=9876), TX_REJECTED),
    ]

    # can't super_adjudicate after timeout
    adj_no_and_appeal_and_superadj_timeout_and_attempt_superadj_scenario = (
        adj_no_and_appeal_scenario
        + [
            ("named_wait", dict(name="SUPER_ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
            ("super_adjudicate", dict(should_confirm=0), TX_REJECTED),
        ]
    )

    # adjudication AND super adjudication timeout --> fail safe by assuming challenger is correct, even if challenge came after provisional time window
    all_timed_out_scenario = (
        notary_submit_and_wait_past_provisional_window_and_challenge_scenario
        + [
            ("named_wait", dict(name="ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
            ("appeal", dict(), NOT_CONFIRMED),
            ("named_wait", dict(name="SUPER_ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
        ]
    )

    #
    # Settling
    #

    # Cn settle from appeal timeout state
    adj_yes_and_appeal_timeout_and_settle_scenario = (
        adj_yes_and_appeal_timeout_scenario
        + [
            ("settle", dict(), CONFIRMED),
        ]
    )
    adj_no_and_appeal_timeout_and_settle_scenario = (
        adj_no_and_appeal_timeout_scenario
        + [
            ("settle", dict(), NOT_CONFIRMED),
        ]
    )

    # Can settle from super adjudication complete state
    adj_no_superadj_no_and_settle_scenario = adj_no_superadj_no_scenario + [
        ("settle", dict(), NOT_CONFIRMED),
    ]
    adj_yes_superadj_yes_and_settle_scenario = adj_yes_superadj_yes_scenario + [
        ("settle", dict(), CONFIRMED),
    ]

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


@pytest.mark.asyncio
async def test_settle_where_challenger_loses(ctx_factory):
    ctx = ctx_factory()

    # Notary should stay the same
    # Challenger should lose 25
    # Pool should gain 25

    # await run_scenario(
    #     ctx,
    #     [
    #         ("submit", dict(via_notary=True, cid=100, address=1234), CONFIRMED),
    #         ("challenge", dict(), NOT_CONFIRMED),
    #         ("named_wait", dict(name="ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
    #         ("named_wait", dict(name="APPEAL_TIME_WINDOW"), NOT_CONFIRMED),
    #         ("settle", dict(), NOT_CONFIRMED),
    #     ],
    # )


@pytest.mark.asyncio
async def test_settle_where_challenger_wins_deposit_from_submitter(ctx_factory):
    ctx = ctx_factory()

    # Notary should lose 25
    # Challenger should gain 25
    # Security pool should stay the same

    await run_scenario(
        ctx,
        [
            ("submit", dict(via_notary=True, cid=100, address=1234), CONFIRMED),
            ("challenge", dict(), NOT_CONFIRMED),
            ("named_wait", dict(name="ADJUDICATION_TIME_WINDOW"), NOT_CONFIRMED),
            ("named_wait", dict(name="APPEAL_TIME_WINDOW"), NOT_CONFIRMED),
            ("settle", dict(), NOT_CONFIRMED),
        ],
    )


@pytest.mark.asyncio
async def test_settle_where_challenger_wins_reward_from_security_pool(ctx_factory):
    ctx = ctx_factory()

    # (challenge occurs after provisional window)

    # Notary should stay the same
    # Challenger should gain 25
    # Pool should reduce 25


@pytest.mark.asyncio
async def test_settle_where_challenger_would_win_reward_but_for_empty_security_pool(
    ctx_factory,
):
    ctx = ctx_factory()

    # (challenge occurs after provisional window)

    # Notary should stay the same
    # Challenger should stay the same
    # Pool should stay the same
