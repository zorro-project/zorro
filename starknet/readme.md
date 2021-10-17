Set up Cairo (this is global to your machine)
```bash
pyenv global 3.7.11

# It would be nice to configure a cairo install specific to our project,
# but e.g. vs code extensions seem to expect a cairo install at the location
# specified in the cairo documentation. Rather than swimming upstream and
# needing to specify custom paths everywhere, am just relenting for now.
python3.7 -m venv ~/cairo_venv
source ~/cairo_venv/bin/activate

brew install gmp

# TODO: use requirements.txt
pip3 install ecdsa fastecdsa sympy pytest pytest-asyncio cairo-lang
```

VS Code configuration
```
# 1. Use cmd-shift-p to install the `code` command line tool
# 2. Close VS Code
# 3. Run `source ~/cairo_venv/bin/activate`
# 4. `curl -L -O https://github.com/starkware-libs/cairo-lang/releases/download/v0.4.2/cairo-0.4.2.vsix`
# 5. Run `code --install-extension cairo-0.4.2.vsix`
# 6. Launch by running `code` (must be done with venv active)
# 7. Use cmd-shift-p to select "format code"; when error prompt come up, select Cairo
# 8. (optional) Search extensions for "Language support for Cairo" by Eric Lau and install
```
