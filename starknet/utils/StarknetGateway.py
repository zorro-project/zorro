# This file results from manually hacking up StarkNet's cli program to turn it
# into a basic library. This file will likely ultimately die, but maybe is
# temporarily useful.

# Derived from  https://github.com/starkware-libs/cairo-lang/blob/master/src/starkware/starknet/cli/starknet_cli.py
# TODO: toss this in favor of using `starknet.js` after # TODO: rewrite using `starknet.js` after https://github.com/seanjameshan/starknet.js/pull/9 is merged is merged

import asyncio
import functools
import json
import os
import sys
from types import SimpleNamespace

from services.external_api.base_client import RetryConfig
from starkware.cairo.lang.compiler.program import Program
from starkware.cairo.lang.version import __version__
from starkware.cairo.lang.vm.reconstruct_traceback import reconstruct_traceback
from starkware.starknet.compiler.compile import get_selector_from_name
from starkware.starknet.definitions import fields
from starkware.starknet.services.api.contract_definition import ContractDefinition
from starkware.starknet.services.api.feeder_gateway.feeder_gateway_client import (
    FeederGatewayClient,
)
from starkware.starknet.services.api.gateway.gateway_client import GatewayClient
from starkware.starknet.services.api.gateway.transaction import Deploy, InvokeFunction
from starkware.starkware_utils.error_handling import StarkErrorCode


def get_gateway_client() -> GatewayClient:
    retry_config = RetryConfig(n_retries=1)
    return GatewayClient(
        url="https://alpha3.starknet.io/gateway", retry_config=retry_config
    )


def get_feeder_gateway_client() -> FeederGatewayClient:
    retry_config = RetryConfig(n_retries=1)
    return FeederGatewayClient(
        url="https://alpha3.starknet.io/feeder_gateway", retry_config=retry_config
    )


def readfile(path):
    with open(path, "r") as file:
        return file.read()


async def deploy(path):
    gateway_client = get_gateway_client()

    address = fields.ContractAddressField.get_random_value()

    contract_definition = ContractDefinition.loads(readfile(path))
    tx = Deploy(contract_address=address, contract_definition=contract_definition)

    gateway_response = await gateway_client.add_transaction(tx=tx)

    assert (
        gateway_response["code"] == StarkErrorCode.TRANSACTION_RECEIVED.name
    ), f"Failed to send transaction. Response: {gateway_response}."

    return SimpleNamespace(address=address, tx_id=gateway_response["tx_id"])


async def call(address, abi_path, function, inputs):
    return await _invoke_or_call(address, abi_path, function, inputs, True)


async def invoke(address, abi_path, function, inputs):
    return await _invoke_or_call(address, abi_path, function, inputs, False)


async def _invoke_or_call(address, abi_path, function, inputs, call: bool):
    abi = json.loads(readfile(abi_path))
    for abi_entry in abi:
        if abi_entry["type"] == "function" and abi_entry["name"] == function:
            previous_felt_input = None
            current_inputs_ptr = 0
            for input_desc in abi_entry["inputs"]:
                if input_desc["type"] == "felt":
                    assert current_inputs_ptr < len(
                        inputs
                    ), f"Expected at least {current_inputs_ptr + 1} inputs, got {len(inputs)}."

                    previous_felt_input = inputs[current_inputs_ptr]
                    current_inputs_ptr += 1
                elif input_desc["type"] == "felt*":
                    assert previous_felt_input is not None, (
                        f'The array argument {input_desc["name"]} of type felt* must be preceded '
                        "by a length argument of type felt."
                    )

                    current_inputs_ptr += previous_felt_input
                    previous_felt_input = None
                else:
                    raise Exception(f'Type {input_desc["type"]} is not supported.')
            break
    else:
        raise Exception(f"Function {function} not found.")
    selector = get_selector_from_name(function)
    assert (
        len(inputs) == current_inputs_ptr
    ), f"Wrong number of arguments. Expected {current_inputs_ptr}, got {len(inputs)}."
    calldata = inputs

    tx = InvokeFunction(
        contract_address=address, entry_point_selector=selector, calldata=calldata
    )

    gateway_response: dict
    if call:
        feeder_client = get_feeder_gateway_client()
        gateway_response = await feeder_client.call_contract(
            tx, None
        )  # was args.block_id
        print(*gateway_response["result"])
        # TODO: return something here
    else:
        gateway_client = get_gateway_client()
        gateway_response = await gateway_client.add_transaction(tx=tx)
        assert (
            gateway_response["code"] == StarkErrorCode.TRANSACTION_RECEIVED.name
        ), f"Failed to send transaction. Response: {gateway_response}."

        return SimpleNamespace(tx_id=gateway_response["tx_id"])
