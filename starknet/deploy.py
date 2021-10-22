#!/usr/bin/env python3

# TODO: rewrite using `starknet.js` after https://github.com/seanjameshan/starknet.js/pull/9 is merged

import asyncio
from asyncio.tasks import wait_for
import random

from utils.StarknetGateway import deploy, call, invoke
from OpenZepplin.Signer import Signer


# XXX: *NOT* a cryptographically secure approach to key generation
def generate_private_key():
    return int(random.random() * 2 ** 250)


async def deploy_and_initialize_account(signer):
    deploy_result = await deploy("build/OpenZepplin/Account_compiled.json")
    initialize_result = await invoke(
        deploy_result.address,
        "build/OpenZepplin/Account_abi.json",
        "initialize",
        [signer.public_key, deploy_result.address, 0],
    )

    return (deploy_result, initialize_result)


async def main():
    # XXX: *NOT* a cryptographically secure approach to key generation
    adjudicator = Signer(generate_private_key())
    notary = Signer(generate_private_key())

    (
        notary_deploy_result,
        notary_initialize_result,
    ) = await deploy_and_initialize_account(notary)

    (
        adjudicator_deploy_result,
        adjudicator_initialize_result,
    ) = await deploy_and_initialize_account(adjudicator)

    nym_deploy_result = await deploy("build/Nym_compiled.json")
    nym_initialize_result = await invoke(
        nym_deploy_result.address,
        "build/Nym_abi.json",
        "initialize",
        [notary.public_key, adjudicator.public_key],
    )

    print(f"Adjudicator contract address: {adjudicator_deploy_result.address}")
    print(f"Notary contract address: {notary_deploy_result.address}")
    print(f"Nym contract address: {nym_deploy_result.address}")

    print(f"Adjudicator private key: {adjudicator.private_key}")
    print(f"Notary private key: {notary.private_key}")

    print(
        f"Transaction ids:",
        notary_deploy_result.tx_id,
        notary_initialize_result.tx_id,
        adjudicator_deploy_result.tx_id,
        adjudicator_initialize_result.tx_id,
        nym_deploy_result.tx_id,
        nym_initialize_result.tx_id,
    )


if __name__ == "__main__":
    asyncio.run(main())
