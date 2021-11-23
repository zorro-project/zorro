build:
	(cd contracts && poetry run starknet-compile Nym.cairo --output ./build/Nym_compiled.json --abi ./build/Nym_abi.json)
	mkdir -p contracts/build/OpenZeppelin
	(cd contracts && poetry run starknet-compile OpenZeppelin/Account.cairo --output ./build/OpenZeppelin/Account_compiled.json --abi ./build/OpenZeppelin/Account_abi.json)
deploy:
	poetry run ./deploy.py

update-openzeppelin:
	# Rather than playing around with git submodules, we're just doing this for now.
	curl -L -o contracts/OpenZeppelin/Account.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/Account.cairo
	curl -L -o utils/OpenZeppelin/Signer.py https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/tests/utils/Signer.py

	curl -L -o contracts/OpenZeppelin/ERC20.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/token/ERC20.cairo
	curl -L -o contracts/OpenZeppelin/IERC20.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/token/IERC20.cairo
