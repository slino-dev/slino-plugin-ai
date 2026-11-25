#!/usr/bin/env bash
# Builds the ZIP to upload to OpenAI (ChatGPT and Codex) from the committed
# tree: plugin.json at the root, mcp.json, the license, the skills, and the
# icons and onboarding skill plugin.json's OpenAI extension references.
# Prints the ZIP's path.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

manifest=$(git show HEAD:plugin.json)
name=$(jq -r .name <<<"$manifest")
version=$(jq -r .version <<<"$manifest")
mapfile -t references < <(jq -r '.extensions["com.openai"] | (.interface | .logo, .logoDark, .composerIcon, .composerIconDark), .onboardingSkill | strings | ltrimstr("./")' <<<"$manifest")

out=dist/$name-openai-$version.zip
mkdir -p dist
rm -f "$out"
git archive --format=zip -o "$out" HEAD plugin.json mcp.json LICENSE skills "${references[@]}"
echo "$out"
