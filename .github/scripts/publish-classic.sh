#!/usr/bin/env bash
# Copies Revenge Classic builds into the published branch at `classic/<plugin>/` and pushes them.

set -euo pipefail
# shellcheck source=.github/scripts/lib.sh
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

for dir in plugins/*/build/classic; do
    [ -d "$dir" ] || continue

    name="$(basename "$(dirname "$(dirname "$dir")")")"
    mkdir -p "$POOL_CHECKOUT/classic/$name"
    cp "$dir/manifest.json" "$dir/index.js" "$POOL_CHECKOUT/classic/$name/"
done

git -C "$POOL_CHECKOUT" add classic
commit_pool "Classic builds already up to date." "Publish Revenge Classic builds"
