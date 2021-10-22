set -x

poetry run starknet-compile Nym.cairo --output ./build/Nym_compiled.json --abi ./build/Nym_abi.json
mkdir -p build/OpenZepplin
poetry run starknet-compile OpenZepplin/Account.cairo --output ./build/OpenZepplin/Account_compiled.json --abi ./build/OpenZepplin/Account_abi.json
