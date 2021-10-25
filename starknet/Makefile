build:
	(cd contracts && poetry run starknet-compile Nym.cairo --output ./build/Nym_compiled.json --abi ./build/Nym_abi.json)
	mkdir -p contracts/build/OpenZepplin
	(cd contracts && poetry run starknet-compile OpenZepplin/Account.cairo --output ./build/OpenZepplin/Account_compiled.json --abi ./build/OpenZepplin/Account_abi.json)
test:
	(cd contracts && poetry run pytest -s ../test.py)
deploy:
	poetry run ./deploy.py

update-openzepplin:
	# Rather than playing around with git submodules, we're just doing this for now.
	curl -L -o contracts/OpenZepplin/Account.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/Account.cairo
	curl -L -o utils/OpenZepplin/Signer.py https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/test/utils/Signer.py

	curl -L -o contracts/OpenZepplin/ERC20.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/token/ERC20.cairo
	curl -L -o contracts/OpenZepplin/IERC20.cairo https://raw.githubusercontent.com/OpenZeppelin/cairo-contracts/main/contracts/token/IERC20.cairo
