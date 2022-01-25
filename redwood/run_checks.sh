#! /bin/bash

set -eo pipefail

echo "Ensuring lockfile up to date"
yarn install --frozen-lockfile

echo "Running lint and typechecking in parallel"
yarn rw tsc &
yarn rw lint &
wait

echo "Running yarn rw test"
yarn rw test --watch=false --ci

echo "Running yarn rw check"
yarn rw check
