#! /bin/bash

set -eo pipefail

yarn install --frozen-lockfile
yarn rw tsc &
yarn rw lint&
wait

yarn rw test --watch=false --ci
yarn rw check
wait
