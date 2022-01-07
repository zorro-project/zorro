#! /bin/bash

set -eo pipefail

yarn install --frozen-lockfile
yarn rw tsc
yarn rw test --watch=false --ci
yarn rw lint
yarn rw check
