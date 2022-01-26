import asyncio
import pytest
import dill
import os
import sys
from types import SimpleNamespace
import time

from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet, StarknetContract
from starkware.starknet.business_logic.state import BlockInfo

from OpenZeppelin.Signer import Signer
from utils import uint

# pytest-xdest only shows stderr
sys.stdout = sys.stderr

SUPER_ADJUDICATOR_L1_ADDRESS = 0
CONTRACT_SRC = [os.path.dirname(__file__), "..", "..", "contracts", "starknet"]


def compile(path):
    return compile_starknet_files(
        files=[path],
        debug_info=True,
        cairo_path=CONTRACT_SRC,
    )


def get_block_timestamp(starknet_state):
    return starknet_state.state.block_info.block_timestamp


def set_block_timestamp(starknet_state, timestamp):
    starknet_state.state.block_info = BlockInfo(
        starknet_state.state.block_info.block_number, timestamp
    )


async def deploy_account(starknet, signer, account_def):
    return await starknet.deploy(
        contract_def=account_def,
        constructor_calldata=[signer.public_key],
    )


# StarknetContracts contain an immutable reference to StarknetState, which
# means if we want to be able to use StarknetState's `copy` method, we cannot
# rely on StarknetContracts that were created prior to the copy.
# For this reason, we specifically inject a new StarknetState when
# deserializing a contract.
def serialize_contract(contract, abi):
    return dict(
        abi=abi,
        contract_address=contract.contract_address,
        deploy_execution_info=contract.deploy_execution_info,
    )


def unserialize_contract(starknet_state, serialized_contract):
    return StarknetContract(state=starknet_state, **serialized_contract)


@pytest.fixture(scope="session")
def event_loop():
    return asyncio.new_event_loop()


async def build_copyable_deployment():
    starknet = await Starknet.empty()

    # initialize a realistic timestamp
    set_block_timestamp(starknet.state, round(time.time()))

    defs = SimpleNamespace(
        account=compile("OpenZeppelin/account.cairo"),
        erc20=compile("OpenZeppelin/ERC20.cairo"),
        zorro=compile("zorro.cairo"),
    )

    signers = dict(
        admin=Signer(83745982347),
        adjudicator=Signer(7891011),
        notary=Signer(12345),
        challenger=Signer(888333444555),
        minter=Signer(897654321),
        rando=Signer(23904852345),
    )

    # Maps from name -> account contract
    accounts = SimpleNamespace(
        **{
            name: (await deploy_account(starknet, signer, defs.account))
            for name, signer in signers.items()
        }
    )

    erc20 = await starknet.deploy(
        contract_def=defs.erc20,
        constructor_calldata=[accounts.minter.contract_address],
    )

    zorro = await starknet.deploy(
        contract_def=defs.zorro,
        constructor_calldata=[
            1,  # is_in_dev_mode
            accounts.admin.contract_address,
            accounts.notary.contract_address,
            accounts.adjudicator.contract_address,
            SUPER_ADJUDICATOR_L1_ADDRESS,
            erc20.contract_address,
        ],
    )
    (submission_deposit_size,) = (
        await zorro.get_submission_deposit_size(0).call()
    ).result
    (challenge_deposit_size,) = (
        await zorro.get_challenge_deposit_size(0).call()
    ).result
    (challenge_reward_size,) = (await zorro.get_challenge_reward_size(0).call()).result
    time_windows = (await zorro.get_time_windows().call()).result

    consts = SimpleNamespace(
        SUPER_ADJUDICATOR_L1_ADDRESS=SUPER_ADJUDICATOR_L1_ADDRESS,
        SUBMISSION_DEPOSIT_SIZE=submission_deposit_size,
        CHALLENGE_DEPOSIT_SIZE=challenge_deposit_size,
        CHALLENGE_REWARD_SIZE=challenge_reward_size,
        time_windows=time_windows,
    )

    async def give_tokens(recipient, amount):
        await signers["minter"].send_transaction(
            accounts.__dict__["minter"],
            erc20.contract_address,
            "transfer",
            [recipient, *uint(amount)],
        )

    # Give tokens to the notary so they can submit profiles
    initial_notary_funds = consts.SUBMISSION_DEPOSIT_SIZE * 3
    await give_tokens(accounts.notary.contract_address, initial_notary_funds)

    # Give 50 tokens to the eventual challenger so they can afford to challenge
    initial_challenger_funds = consts.CHALLENGE_DEPOSIT_SIZE * 2
    await give_tokens(accounts.challenger.contract_address, initial_challenger_funds)

    # Give tokens to the rando
    await give_tokens(accounts.rando.contract_address, 200)

    return SimpleNamespace(
        starknet=starknet,
        consts=consts,
        signers=signers,
        serialized_contracts=dict(
            notary=serialize_contract(accounts.notary, defs.account.abi),
            adjudicator=serialize_contract(accounts.adjudicator, defs.account.abi),
            challenger=serialize_contract(accounts.challenger, defs.account.abi),
            rando=serialize_contract(accounts.rando, defs.account.abi),
            erc20=serialize_contract(erc20, defs.erc20.abi),
            zorro=serialize_contract(zorro, defs.zorro.abi),
        ),
    )


@pytest.fixture(scope="session")
async def copyable_deployment(request):
    CACHE_KEY = "deployment"
    val = request.config.cache.get(CACHE_KEY, None)
    if val is None:
        val = await build_copyable_deployment()
        res = dill.dumps(val).decode("cp437")
        request.config.cache.set(CACHE_KEY, res)
    else:
        val = dill.loads(val.encode("cp437"))
    return val


@pytest.fixture(scope="session")
async def ctx_factory(copyable_deployment):
    serialized_contracts = copyable_deployment.serialized_contracts
    signers = copyable_deployment.signers
    consts = copyable_deployment.consts

    def make():
        starknet_state = copyable_deployment.starknet.state.copy()
        contracts = {
            name: unserialize_contract(starknet_state, serialized_contract)
            for name, serialized_contract in serialized_contracts.items()
        }

        async def execute(account_name, contract_address, selector_name, calldata):
            return await signers[account_name].send_transaction(
                contracts[account_name],
                contract_address,
                selector_name,
                calldata,
            )

        def advance_clock(num_seconds):
            set_block_timestamp(
                starknet_state, get_block_timestamp(starknet_state) + num_seconds
            )

        return SimpleNamespace(
            starknet=Starknet(starknet_state),
            advance_clock=advance_clock,
            consts=consts,
            execute=execute,
            **contracts,  # notary, zorro, erc20, etc
        )

    return make
