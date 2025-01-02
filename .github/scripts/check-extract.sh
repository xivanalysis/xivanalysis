#!/usr/bin/env bash
echo "Checking if message extract is up to date...";
yarn extract;

if [[ $(git diff --stat locale) != '' ]]; then
	echo "Extract diff found.";
	# DIFF=$(git diff --color=never locale)
	git diff

	echo "::error file=package.json,title=i18n message extraction::Changes to locale files detected. Please run \`yarn extract\` and commit the changes to ensure translations remain in sync.";
	exit 1;
fi;
