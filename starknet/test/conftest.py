import asyncio
import pytest
import dill
import os
import sys
from types import SimpleNamespace

from starkware.starknet.compiler.compile import compile_starknet_files
from starkware.starknet.testing.starknet import Starknet, StarknetContract

from OpenZeppelin.Signer import Signer
from utils import uint

# pytest-xdest only shows stderr
sys.stdout = sys.stderr

SUPER_ADJUDICATOR_L1_ADDRESS = 0
CONTRACT_SRC = [os.path.dirname(__file__), "..", "contracts"]


def compile(path):
    return compile_starknet_files(
        files=[path],
        debug_info=True,
        cairo_path=CONTRACT_SRC,
    )


async def create_account(starknet, signer, account_def):
    return await starknet.deploy(
        contract_def=account_def,
        constructor_calldata=[signer.public_key],
    )


@pytest.fixture(scope="session")
def event_loop():
    return asyncio.new_event_loop()


# StarknetContracts contain an immutable reference to StarknetState, which
# means if we want to be able to use StarknetState's `copy` method, we cannot
# rely on StarknetContracts that were created prior to the copy.
# For that reason, we avoid returning any StarknetContracts in this "copyable"
# deployment:
async def _build_copyable_deployment():
    starknet = await Starknet.empty()

    defs = SimpleNamespace(
        account=compile("OpenZeppelin/account.cairo"),
        erc20=compile("OpenZeppelin/ERC20.cairo"),
        nym=compile("nym.cairo"),
    )

    signers = SimpleNamespace(
        admin=Signer(83745982347),
        adjudicator=Signer(7891011),
        notary=Signer(12345),
        challenger=Signer(888333444555),
        minter=Signer(897654321),
    )

    accounts = SimpleNamespace(
        admin=await create_account(starknet, signers.admin, defs.account),
        notary=await create_account(starknet, signers.notary, defs.account),
        adjudicator=await create_account(starknet, signers.adjudicator, defs.account),
        challenger=await create_account(starknet, signers.challenger, defs.account),
        minter=await create_account(starknet, signers.minter, defs.account),
    )

    erc20 = await starknet.deploy(
        contract_def=defs.erc20,
        constructor_calldata=[accounts.minter.contract_address],
    )

    nym = await starknet.deploy(
        contract_def=defs.nym,
        constructor_calldata=[
            accounts.admin.contract_address,
            accounts.notary.contract_address,
            accounts.adjudicator.contract_address,
            SUPER_ADJUDICATOR_L1_ADDRESS,
            erc20.contract_address,
        ],
    )

    (submission_deposit_size,) = (
        await nym.get_submission_deposit_size(0).call()
    ).result
    (challenge_deposit_size,) = (await nym.get_challenge_deposit_size(0).call()).result
    consts = SimpleNamespace(
        SUPER_ADJUDICATOR_L1_ADDRESS=SUPER_ADJUDICATOR_L1_ADDRESS,
        SUBMISSION_DEPOSIT_SIZE=submission_deposit_size,
        CHALLENGE_DEPOSIT_SIZE=challenge_deposit_size,
    )

    async def give_tokens(recipient, amount):
        await signers.minter.send_transaction(
            accounts.minter,
            erc20.contract_address,
            "transfer",
            [recipient, *uint(amount)],
        )

    # Give tokens to the notary so they can submit profiles
    initial_notary_funds = consts.SUBMISSION_DEPOSIT_SIZE * 3
    await give_tokens(accounts.notary.contract_address, initial_notary_funds)

    # Give 50 tokens to the eventual challenger so they can afford to challenge
    initial_challenger_funds = consts.CHALLENGE_DEPOSIT_SIZE * 2
    await give_tokens(
        accounts.challenger.contract_address,
        initial_challenger_funds,
    )

    # Give remaining tokens to the nym contract (its shared security pool)
    await give_tokens(
        nym.contract_address,
        1000 - initial_notary_funds - initial_challenger_funds,
    )

    return SimpleNamespace(
        starknet=starknet,
        defs=defs,
        consts=consts,
        signers=signers,
        addresses=SimpleNamespace(
            notary=accounts.notary.contract_address,
            adjudicator=accounts.adjudicator.contract_address,
            challenger=accounts.challenger.contract_address,
            erc20=erc20.contract_address,
            nym=nym.contract_address,
        ),
    )


@pytest.fixture(scope="session")
async def copyable_deployment(request):
    CACHE_KEY = "deployment"
    val = request.config.cache.get(CACHE_KEY, None)
    if val is None:
        val = await _build_copyable_deployment()
        res = dill.dumps(val).decode("cp437")
        request.config.cache.set(CACHE_KEY, res)
    else:
        val = dill.loads(val.encode("cp437"))
    return val


@pytest.fixture(scope="session")
async def ctx_factory(copyable_deployment):
    defs = copyable_deployment.defs
    addresses = copyable_deployment.addresses
    signers = copyable_deployment.signers
    consts = copyable_deployment.consts

    def make():
        starknet_state = copyable_deployment.starknet.state.copy()

        accounts = SimpleNamespace(
            notary=StarknetContract(
                state=starknet_state,
                abi=defs.account.abi,
                contract_address=addresses.notary,
            ),
            adjudicator=StarknetContract(
                state=starknet_state,
                abi=defs.account.abi,
                contract_address=addresses.adjudicator,
            ),
            challenger=StarknetContract(
                state=starknet_state,
                abi=defs.account.abi,
                contract_address=addresses.challenger,
            ),
        )

        async def execute(account_name, contract_address, selector_name, calldata):
            return await signers.__dict__[account_name].send_transaction(
                accounts.__dict__[account_name],
                contract_address,
                selector_name,
                calldata,
            )

        return SimpleNamespace(
            starknet=Starknet(starknet_state),
            consts=consts,
            accounts=accounts,
            execute=execute,
            nym=StarknetContract(
                state=starknet_state,
                abi=defs.nym.abi,
                contract_address=addresses.nym,
            ),
            erc20=StarknetContract(
                state=starknet_state,
                abi=defs.erc20.abi,
                contract_address=addresses.erc20,
            ),
        )

    return make
