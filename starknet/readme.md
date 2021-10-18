Set up project dependencies. Run the following in the current folder:

```bash
# Install `asdf` to manage python tool version https://asdf-vm.com/
# Make sure you also configure your shell to use it
brew install asdf

brew install gmp

# Install the `poetry` dependency manager for Python
pip install --user poetry
poetry config virtualenvs.in-project true

# Set up the virtual env and install project dependencies
poetry install

# Make sure the virtual environment was correctly installed within the working directory
ls .venv
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
