# Set up project dependencies. Run the following in the current folder:

```bash
# Install `asdf` to manage python tool version https://asdf-vm.com/
# Make sure you also configure your shell to use it
brew install asdf

# Install python with `asdf`
# See more: https://skeptric.com/asdf-python/
asdf plugin add python

brew install gmp

# Install the `poetry` dependency manager for Python
pip install poetry
asdf reshim python

# Set up the virtual env and install project dependencies
env "CFLAGS=-I/opt/homebrew/include" poetry install

# Make sure the virtual environment was correctly installed within the working directory
ls .venv

# Install the development/deployment dependencies
yarn install
```

VS Code configuration

1. Use cmd-shift-p to install the `code` command line tool
2. Close VS Code
3. `curl -L -O https://github.com/starkware-libs/cairo-lang/releases/download/v0.4.2/cairo-0.4.2.vsix`
4. Run `code --install-extension cairo-0.4.2.vsix`
5. Run `code` in the `starknet/` directory
6. VS Code should automatically detect your local virtual environment in `.venv` and offer to use it. Click "yes".
7. Use cmd-shift-p to select "format code"; when error prompt come up, select Cairo
8. (optional) Search extensions for "Language support for Cairo" by Eric Lau and install

# To see error messages

```
poetry run starknet tx_status --network alpha-goerli --hash "0x4b956ab1ddfe43ed83f10c0e9ad04702e76e1a7bdf73a9f7791eb1666b97c8" --contract starknet-artifacts/contracts/zorro.cairo/zorro.json --error_message
```

# Updating Cairo

- `poetry add cairo-lang@latest`
- `yarn upgrade @shardlabs/starknet-hardhat-plugin --latest`

# Faucets

Goerli eth: https://faucets.chain.link/goerli
Goerli PNK for testing super adjudication: https://goerli.etherscan.io/address/0x4b89e798b10478a839ea0abcf86c4b94a3c782a4#writeContract

# Useful etherscan links

Goerli Kleros arbitrator https://goerli.etherscan.io/address/0x1128ed55ab2d796fa92d2f8e1f336d745354a77a#code

- passPhase x2, drawJurors, passPhase?
